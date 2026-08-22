import { FetchFailure, SchemaFetchResult, SchemaFile, schemaFileSchema } from "./types"
import { parse as parseTtl } from "@frogcat/ttl2jsonld"
import { RO_CRATE_VERSION } from "@/lib/constants"
import { toArray, prependBasePath, isValidUrl } from "@/lib/utils"
import {
    findKnownSchemas,
    getEffectiveSchemaUrl,
    KnownSchema,
    SchemaResolverSettingsData
} from "@/lib/state/schema-resolver-settings"

type UnknownSchema = string

/** How long term fetches are collected before they are grouped by prefix and requested. */
const TERM_FETCH_DEBOUNCE_MS = 100

/** Node/context counts presented for a loaded schema in the user interface. */
export interface LoadedSchemaInfos {
    contextEntries: number
    nodes: number
}

/** Everything the resolver keeps about a loaded schema. */
interface LoadedSchemaEntry extends LoadedSchemaInfos {
    schema: SchemaFile
}

/**
 * The URL base shared by terms of one vocabulary: everything up to and
 * including the last `/` or `#` (e.g. `https://schema.org/` or
 * `http://www.opengis.net/ont/geosparql#`).
 */
export function getTermBase(term: string): string {
    const splitAt = Math.max(term.lastIndexOf("#"), term.lastIndexOf("/"))
    if (splitAt <= "https://".length) return term
    return term.slice(0, splitAt + 1)
}

/** The schema fetch API only accepts https, so upgrade http term URLs. */
function toSecureFetchUrl(url: string): string {
    if (url.startsWith("http://")) return "https://" + url.slice("http://".length)
    return url
}

function looksLikeTurtle(text: string): boolean {
    const start = text
        .replace(/^\uFEFF/, "")
        .trimStart()
        .slice(0, 500)
    return start.startsWith("@prefix") || start.startsWith("@base") || /<https?:\/\//.test(start)
}

interface TermRequest {
    nodeId: string
    resolve: (outcome: TermFetchOutcome | null) => void
}

interface TermFetchOutcome {
    key: string
    schema?: SchemaFile
    error?: unknown
}

export class SchemaResolver {
    // SchemaResolver becomes ready with the first {@link SchemaResolver.updateRegisteredSchemas} call
    private ready = false
    private waitingForReady: Promise<void> | null = null
    private runningFetches: Map<string, Promise<SchemaFile>> = new Map()
    private spec: RO_CRATE_VERSION | null = null

    // Schemas whose terms have been resolved and can be served without a new
    // fetch. Keys are the schema display name for URL-based schemas, the
    // vocabulary base URL for term-resolved vocabularies, and the full term
    // URL for per-term fallback loads.
    private loadedSchemas: Map<string, LoadedSchemaEntry> = new Map()

    // Schemas that were requested but could not be resolved.
    private schemaIssues: Map<string, unknown> = new Map()

    private isExcluded(id: string): boolean {
        return this.loadedSchemas.has(id) || this.schemaIssues.has(id)
    }

    // Term-fetch batching: terms of the same vocabulary are collected for a
    // short debounce window and then fetched once by base URL.
    private termQueue: Map<string, TermRequest[]> = new Map()
    private termFlushTimer: ReturnType<typeof setTimeout> | null = null
    private runningTermFetches: Map<string, Promise<void>> = new Map()

    constructor(private settings: SchemaResolverSettingsData) {}

    async autoload(nodeId: string) {
        // Map key is schema id or, for term fetches, the vocabulary base/term.
        const loadedSchemas: Map<string, { schema?: SchemaFile; error?: unknown }> = new Map()

        // Wait until the SchemaResolver becomes ready. Crucial to prevent errors on initial render
        await this.waitForReady()

        const matched = findKnownSchemas(this.settings.knownSchemas, nodeId, this.spec ?? undefined)
        const knownWithUrl = matched.filter((schema) => getEffectiveSchemaUrl(schema) !== "")
        const knownWithoutUrl = matched.filter(
            (schema) => getEffectiveSchemaUrl(schema) === "" && schema.matchesUrls.every(isValidUrl)
        )

        let successfulSchemaFetches = 0
        for (const registeredSchema of knownWithUrl) {
            if (this.isExcluded(registeredSchema.displayName)) {
                const alreadyLoaded = this.loadedSchemas.get(registeredSchema.displayName)
                if (alreadyLoaded) {
                    loadedSchemas.set(registeredSchema.displayName, {
                        schema: alreadyLoaded.schema
                    })
                    successfulSchemaFetches++
                }
                continue
            }

            try {
                const schema = await this.fetchSchema(registeredSchema)
                this.markLoaded(registeredSchema.displayName, schema)
                loadedSchemas.set(registeredSchema.displayName, { schema })
                successfulSchemaFetches++
            } catch (e) {
                console.error(`Failed to get schema with key ${registeredSchema.displayName}:`, e)
                this.recordSchemaFailure(registeredSchema.displayName, e)
                loadedSchemas.set(registeredSchema.displayName, { error: e })
            }
        }

        if (successfulSchemaFetches > 0) {
            // Abort here, don't go into term fetching. Schema fetching should already cover the required term
            // Otherwise the schema configuration is invalid, in which case a term load failure is expected.
            return loadedSchemas
        }

        const needsTermFetch =
            knownWithoutUrl.length > 0 ||
            (matched.length === 0 && this.settings.allowUnknownSchemas)
        if (needsTermFetch) {
            const knownSchemaId =
                knownWithoutUrl.length > 0 ? knownWithoutUrl[0].displayName : undefined
            const outcome = await this.termFetch(nodeId, knownSchemaId)
            if (outcome?.schema) {
                loadedSchemas.set(outcome.key, { schema: outcome.schema })
            } else if (outcome?.error) {
                loadedSchemas.set(outcome.key, { error: outcome.error })
            }
        }

        return loadedSchemas
    }

    private async termFetch(
        nodeId: string,
        knownSchemaId: string | undefined
    ): Promise<TermFetchOutcome | null> {
        if (knownSchemaId !== undefined && this.isExcluded(knownSchemaId)) return null
        const base = getTermBase(nodeId)
        if (this.loadedSchemas.has(base)) return null

        return new Promise<TermFetchOutcome | null>((resolve) => {
            let group = this.termQueue.get(base)
            if (!group) {
                group = []
                this.termQueue.set(base, group)
            }
            group.push({ nodeId, resolve })
            this.scheduleTermFetchFlush()
        })
    }

    private scheduleTermFetchFlush() {
        if (this.termFlushTimer != null) return
        this.termFlushTimer = setTimeout(() => {
            this.termFlushTimer = null
            void this.flushTermFetches()
        }, TERM_FETCH_DEBOUNCE_MS)
    }

    private async flushTermFetches() {
        const batches = this.termQueue
        this.termQueue = new Map()
        for (const [base, requests] of batches) {
            await this.processTermBase(base, requests)
        }
    }

    private async processTermBase(base: string, requests: TermRequest[]) {
        const running = this.runningTermFetches.get(base)
        if (running) {
            await running
            if (this.loadedSchemas.has(base)) {
                for (const request of requests) request.resolve(null)
            } else {
                // The previous attempt failed; retry for these late requests.
                await this.resolveTermBase(base, requests)
            }
            return
        }
        await this.resolveTermBase(base, requests)
    }

    private async resolveTermBase(base: string, requests: TermRequest[]) {
        if (this.loadedSchemas.has(base)) {
            for (const request of requests) request.resolve(null)
            return
        }

        const promise = this.doFetchTerms(base, requests)
        this.runningTermFetches.set(
            base,
            promise.catch(() => undefined)
        )
        await promise
        this.runningTermFetches.delete(base)
    }

    private async doFetchTerms(base: string, requests: TermRequest[]) {
        try {
            const schema = await this.fetchSchemaUrl(base)
            this.markLoaded(base, schema)
            for (const request of requests) request.resolve({ key: base, schema })
        } catch (e) {
            console.error(`Failed to fetch term base ${base}:`, e)
            // The base URL itself did not resolve; fall back to each term URL.
            await Promise.all(
                requests.map(async (request) => {
                    try {
                        const schema = await this.fetchSchemaUrl(request.nodeId)
                        this.markLoaded(request.nodeId, schema)
                        request.resolve({ key: request.nodeId, schema })
                    } catch (termError) {
                        this.recordSchemaFailure(request.nodeId, termError)
                        request.resolve({ key: request.nodeId, error: termError })
                    }
                })
            )
        }
    }

    private waitForReady(): Promise<void> {
        if (!this.ready) {
            if (!this.waitingForReady) {
                this.waitingForReady = new Promise((resolve, reject) => {
                    const interval = setInterval(() => {
                        if (this.ready) {
                            clearInterval(interval)
                            clearTimeout(timeout)
                            resolve()
                        }
                    }, 50)

                    const timeout = setTimeout(() => {
                        clearInterval(interval)
                        clearTimeout(timeout)
                        reject(
                            new Error(
                                "SchemaResolver timed out while waiting to become ready: did not receive updateRegisteredSchemas within 2 seconds"
                            )
                        )
                    }, 2000)
                })
            }

            return this.waitingForReady
        }

        return Promise.resolve()
    }

    updateRegisteredSchemas(settings: SchemaResolverSettingsData, spec: RO_CRATE_VERSION) {
        this.ready = true
        this.settings = settings
        this.spec = spec
    }

    async forceLoad(schemaId: string) {
        const schema = this.settings.knownSchemas.find((schema) => schema.displayName === schemaId)
        if (!schema) return

        try {
            const fetched = await this.fetchSchema(schema)
            if (fetched) this.markLoaded(schemaId, fetched)
            return fetched
        } catch (e) {
            this.recordSchemaFailure(schemaId, e)
            return undefined
        }
    }

    /**
     * Returns fetch operations for all known schemas that have a download URL.
     * Schemas without a URL (term-resolved vocabularies) are loaded on demand.
     */
    loadAll() {
        return this.settings.knownSchemas
            .filter((schema) => getEffectiveSchemaUrl(schema) !== "")
            .filter((schema) => !this.isExcluded(schema.displayName))
            .filter((schema) =>
                this.spec
                    ? schema.restrictTo.includes(this.spec) || schema.restrictTo.length === 0
                    : true
            )
            .map((schema) => ({
                schema: schema,
                data: this.fetchSchema(schema)
                    .then((fetched) => {
                        this.markLoaded(schema.displayName, fetched)
                        return fetched
                    })
                    .catch((e) => this.recordSchemaFailure(schema.displayName, e))
            }))
    }

    private async fetchSchema(schema: KnownSchema | UnknownSchema): Promise<SchemaFile> {
        if (typeof schema === "string" && !this.settings.allowUnknownSchemas) {
            throw new Error(
                `No schema known for ${schema}. If you want to allow unknown schemas, allow them in the settings.`
            )
        }

        const url =
            typeof schema === "string"
                ? schema
                : getEffectiveSchemaUrl(schema) ||
                  schema.matchesUrls.find((prefix) => isValidUrl(prefix))
        if (!url)
            throw new Error(
                "Could not determine the download URL of this schema. Please specify a valid download URL"
            )
        return this.fetchSchemaUrl(url)
    }

    private async fetchSchemaUrl(url: string): Promise<SchemaFile> {
        const secureUrl = toSecureFetchUrl(url)
        const existing = this.runningFetches.get(secureUrl)
        if (existing) {
            // Another fetch of this exact URL is already running; share its result.
            return existing
        }

        const promise = this.executeFetch(secureUrl)
        this.runningFetches.set(secureUrl, promise)
        return promise
    }

    private markLoaded(id: string, schema: SchemaFile) {
        this.schemaIssues.delete(id)
        let contextEntries = 0
        if ("@context" in schema) {
            for (const value of Object.values(schema["@context"])) {
                if (typeof value === "string") contextEntries += 1
            }
        }
        this.loadedSchemas.set(id, {
            schema,
            contextEntries,
            nodes: schema["@graph"]?.length ?? 0
        })
    }

    /** Loaded-schema counts for the user interface. */
    getLoadedSchemaStatus(): Map<string, LoadedSchemaInfos> {
        const status = new Map<string, LoadedSchemaInfos>()
        for (const [id, entry] of this.loadedSchemas) {
            status.set(id, { contextEntries: entry.contextEntries, nodes: entry.nodes })
        }
        return status
    }

    /** Schemas that could not be loaded, for the user interface. */
    getSchemaIssues(): Map<string, unknown> {
        return this.schemaIssues
    }

    recordSchemaFailure(id: string, error: unknown) {
        this.schemaIssues.set(id, error)
    }

    /** Forget all resolver state for a schema, so it can be loaded again. */
    removeSchemaState(id: string) {
        this.loadedSchemas.delete(id)
        this.schemaIssues.delete(id)
    }

    private async executeFetch(url: string): Promise<SchemaFile> {
        console.log("Fetching terms from " + url)
        const res = await fetch(
            prependBasePath("/api/schemas/fetch?url=" + encodeURIComponent(url))
        )
        const body = (await res.json()) as
            SchemaFetchResult | { error: string; attempts?: FetchFailure[] }

        if ("error" in body) {
            throw new Error(
                body.error +
                    ` (${body.attempts?.map((attempt) => `Tried ${attempt.accept} but got "${attempt.error}" (code: ${attempt.status})`).join("; ") ?? "No further information"})`
            )
        }

        const schema = this.parseSchemaBody(body)
        this.runningFetches.delete(url)
        console.log(
            `Successfully loaded terms from ${url} (content-type: ${res.headers?.get("content-type")}, status: ${res.status})`
        )
        return schema
    }

    private parseSchemaBody(body: SchemaFetchResult): SchemaFile {
        if (body.format === "jsonld") {
            try {
                const data: unknown = JSON.parse(body.content)
                if (data && typeof data === "object" && "@graph" in data) {
                    return schemaFileSchema.parse(data)
                }
                throw new Error("Response was not a JSON-LD schema")
            } catch (e) {
                // Some hosts serve Turtle as text/plain, which is then mislabeled
                // as JSON-LD. Fall back to a Turtle parse in that case.
                if (looksLikeTurtle(body.content)) {
                    return this.parseTurtleContent(body.content)
                }
                throw e
            }
        } else if (body.format === "turtle") {
            return this.parseTurtleContent(body.content)
        } else throw new Error(`Unknown format ${body.format}`)
    }

    private parseTurtleContent(content: string): SchemaFile {
        const rawJson = parseTtl(content)

        // Rewrite rdf:type style definitions to @type style definitions.
        // Remove owl references, use rdf and rdfs.
        rawJson["@graph"] = rawJson["@graph"].map((e) => {
            if ("rdf:type" in e) {
                e["@type"] = (e["rdf:type"] as IReference)["@id"]
            }

            if (e["@type"]) {
                e["@type"] = toArray(e["@type"]).map((type) => {
                    if (type === "owl:Class") return "rdfs:Class"
                    if (type === "owl:ObjectProperty") return "rdf:Property"
                    return type
                })
            }

            return e
        })

        rawJson["@graph"] = rawJson["@graph"].filter((e) => "@type" in e)
        return schemaFileSchema.parse(rawJson)
    }
}
