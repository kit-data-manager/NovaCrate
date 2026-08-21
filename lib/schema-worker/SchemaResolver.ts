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

export const DedupedSymbol = Symbol(
    "return value for fetch operations that are deduped and therefore aborted"
)
type DedupedSymbol = typeof DedupedSymbol
type UnknownSchema = string

/** How long term fetches are collected before they are grouped by prefix and requested. */
const TERM_FETCH_DEBOUNCE_MS = 100

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

    // Term-fetch batching: terms of the same vocabulary are collected for a
    // short debounce window and then fetched once by base URL.
    private termQueue: Map<string, TermRequest[]> = new Map()
    private termFlushTimer: ReturnType<typeof setTimeout> | null = null
    private runningTermFetches: Map<string, Promise<void>> = new Map()
    private loadedTermBases: Set<string> = new Set()

    constructor(private settings: SchemaResolverSettingsData) {}

    async autoload(nodeId: string, exclude: string[]) {
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
            if (exclude.includes(registeredSchema.displayName)) continue

            try {
                const schema = await this.fetchSchema(registeredSchema)
                if (schema === DedupedSymbol) continue // schema is already being fetched elsewhere in parallel
                loadedSchemas.set(registeredSchema.displayName, { schema })
                successfulSchemaFetches++
            } catch (e) {
                console.error(`Failed to get schema with key ${registeredSchema.displayName}:`, e)
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
            const outcome = await this.termFetch(nodeId, knownSchemaId, exclude)
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
        knownSchemaId: string | undefined,
        exclude: string[]
    ): Promise<TermFetchOutcome | null> {
        if (knownSchemaId !== undefined && exclude.includes(knownSchemaId)) return null
        const base = getTermBase(nodeId)
        if (this.loadedTermBases.has(base)) return null

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
            if (this.loadedTermBases.has(base)) {
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
        if (this.loadedTermBases.has(base)) {
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
            if (schema === DedupedSymbol) {
                // Another fetch of this exact base URL is in progress and will
                // populate the graph; nothing to add here.
                for (const request of requests) request.resolve(null)
                return
            }
            this.loadedTermBases.add(base)
            for (const request of requests) request.resolve({ key: base, schema })
        } catch (e) {
            console.error(`Failed to fetch term base ${base}:`, e)
            // The base URL itself did not resolve; fall back to each term URL.
            await Promise.all(
                requests.map(async (request) => {
                    try {
                        const schema = await this.fetchSchemaUrl(request.nodeId)
                        request.resolve(
                            schema === DedupedSymbol ? null : { key: request.nodeId, schema }
                        )
                    } catch (termError) {
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
        // Schemas without a download URL can only be loaded per term.
        if (getEffectiveSchemaUrl(schema) === "") return
        const fetched = await this.fetchSchema(schema)
        if (fetched === DedupedSymbol) return
        return fetched
    }

    /**
     * Returns fetch operations for all known schemas that have a download URL.
     * Schemas without a URL (term-resolved vocabularies) are loaded on demand.
     */
    loadAll(exclude: string[]) {
        const schemas = this.settings.knownSchemas
            .filter((schema) => getEffectiveSchemaUrl(schema) !== "")
            .filter((schema) => !exclude.includes(schema.displayName))
            .filter((schema) =>
                this.spec
                    ? schema.restrictTo.includes(this.spec) || schema.restrictTo.length === 0
                    : true
            )
        return schemas.map((schema) => ({
            schema: schema,
            data: this.fetchSchema(schema)
        }))
    }

    private async fetchSchema(
        schema: KnownSchema | UnknownSchema
    ): Promise<SchemaFile | DedupedSymbol> {
        if (typeof schema === "string" && !this.settings.allowUnknownSchemas) {
            throw new Error(
                `No schema known for ${schema}. If you want to allow unknown schemas, allow them in the settings.`
            )
        }

        const url = typeof schema === "string" ? schema : getEffectiveSchemaUrl(schema)
        return this.fetchSchemaUrl(url)
    }

    private async fetchSchemaUrl(url: string): Promise<SchemaFile | DedupedSymbol> {
        const secureUrl = toSecureFetchUrl(url)
        const existing = this.runningFetches.get(secureUrl)
        if (existing) {
            // After the existing fetch is done, return with DedupedSymbol.
            // The existing fetch will add the schema to the editor store, so we
            // just wait until it is done.
            return existing.then(() => DedupedSymbol)
        }

        const promise = this.executeFetch(secureUrl)
        this.runningFetches.set(secureUrl, promise)
        return promise
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
