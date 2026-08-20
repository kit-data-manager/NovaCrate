import { FetchFailure, SchemaFetchResult, SchemaFile, schemaFileSchema } from "./types"
import { parse as parseTtl } from "@frogcat/ttl2jsonld"
import { RO_CRATE_VERSION } from "@/lib/constants"
import { toArray } from "@/lib/utils"
import {
    findKnownSchemas,
    getEffectiveSchemaUrl,
    KnownSchema,
    SchemaResolverSettings
} from "@/lib/state/schema-resolver-settings"
import { addBasePath } from "next/dist/client/add-base-path"

export const DedupedSymbol = Symbol(
    "return value for fetch operations that are deduped and therefore aborted"
)
type DedupedSymbol = typeof DedupedSymbol
type UnknownSchema = string

export class SchemaResolver {
    // SchemaResolver becomes ready with the first {@link SchemaResolver.updateRegisteredSchemas} call
    private ready = false
    private waitingForReady: Promise<void> | null = null
    private runningFetches: Map<string, Promise<SchemaFile>> = new Map()
    private spec: RO_CRATE_VERSION | null = null

    constructor(private settings: SchemaResolverSettings) {}

    async autoload(nodeId: string, exclude: string[]) {
        // Map key is schema id
        const loadedSchemas: Map<string, { schema?: SchemaFile; error?: unknown }> = new Map()
        // Map key is node id
        const loadedUnknownSchemas: Map<string, { schema?: SchemaFile; error?: unknown }> =
            new Map()

        // Wait until the SchemaResolver becomes ready. Crucial to prevent errors on initial render
        await this.waitForReady()

        const matched = findKnownSchemas(this.settings.knownSchemas, nodeId, this.spec ?? undefined)

        for (const registeredSchema of matched) {
            if (exclude.includes(registeredSchema.id)) continue

            try {
                const schema = await this.fetchSchema(registeredSchema)
                if (schema === DedupedSymbol) continue // schema is already being fetched elsewhere in parallel
                loadedSchemas.set(registeredSchema.id, { schema })
            } catch (e) {
                console.error(`Failed to get schema with key ${registeredSchema.id}:`, e)
                loadedSchemas.set(registeredSchema.id, { error: e })
            }
        }

        if (matched.length === 0) {
            // No known schema exists. Can we load it anyway?
            if (this.settings.allowUnknownSchemas) {
                // Known schemas are batched (one request per schema), but
                // unknown terms are currently requested one by one. TODO: batch
                // unknown terms that share a vocabulary into a single request.
                try {
                    const schema = await this.fetchSchema(nodeId)
                    if (schema !== DedupedSymbol) loadedUnknownSchemas.set(nodeId, { schema })
                } catch (e) {
                    console.error(`Failed to get unknown schema at ${nodeId}:`, e)
                    loadedUnknownSchemas.set(nodeId, { error: e })
                }
            }
        }

        return loadedSchemas
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

    updateRegisteredSchemas(settings: SchemaResolverSettings, spec: RO_CRATE_VERSION) {
        this.ready = true
        this.settings = settings
        this.spec = spec
    }

    async forceLoad(schemaId: string) {
        const schema = this.settings.knownSchemas.find((schema) => schema.id === schemaId)
        if (!schema) return
        const fetched = await this.fetchSchema(schema)
        if (fetched === DedupedSymbol) return
        return fetched
    }

    loadAll(exclude: string[]) {
        const schemas = this.settings.knownSchemas
            .filter((schema) => !exclude.includes(schema.id))
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
        const existing = this.runningFetches.get(url)
        if (existing) {
            return existing.then(() => DedupedSymbol) // After the existing fetch is done, return with DedupedSymbol
            // Because the existing fetch will actually fetch the schema and add it to the editor store, we do not need to fetch it again.
            // We simply wait until the existing fetch is done.
        } else {
            const executeFetch = async () => {
                const res = await fetch(
                    addBasePath("/api/schemas/fetch?url=" + encodeURIComponent(url))
                )
                const body = (await res.json()) as
                    | SchemaFetchResult
                    | { error: string; attempts?: FetchFailure[] }

                if ("error" in body) {
                    throw new Error(
                        body.error +
                            ` (${body.attempts?.map((attempt) => `Tried ${attempt.accept} but got "${attempt.error}" (code: ${attempt.status})`).join("; ") ?? "No further information"})`
                    )
                } else {
                    if (body.format === "jsonld") {
                        const data = JSON.parse(body.content)
                        this.runningFetches.delete(url)
                        return schemaFileSchema.parse(data)
                    } else if (body.format === "turtle") {
                        const rawJson = parseTtl(body.content)

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
                        this.runningFetches.delete(url)
                        return schemaFileSchema.parse(rawJson)
                    } else throw new Error(`Unknown format ${body.format}`)
                }
            }

            const promise = executeFetch()
            this.runningFetches.set(url, promise)
            return promise
        }
    }
}
