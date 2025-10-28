import { SchemaFile, schemaFileSchema } from "./types"
import type { SchemaResolverStore } from "../state/schema-resolver"
import { parse as parseTtl } from "@frogcat/ttl2jsonld"
import { RO_CRATE_VERSION } from "@/lib/constants"

export const DedupedSymbol = Symbol(
    "return value for fetch operations that are deduped and therefore aborted"
)
type DedupedSymbol = typeof DedupedSymbol

export class SchemaResolver {
    // SchemaResolver becomes ready with the first {@link SchemaResolver.updateRegisteredSchemas} call
    private ready = false
    private waitingForReady: Promise<void> | null = null
    private runningFetches: Map<string, Promise<SchemaFile>> = new Map()
    private spec: RO_CRATE_VERSION | null = null

    constructor(private registeredSchemas: SchemaResolverStore["registeredSchemas"]) {}

    async autoload(nodeId: string, exclude: string[]) {
        const loadedSchemas: Map<string, { schema?: SchemaFile; error?: unknown }> = new Map()

        // Wait until the SchemaResolver becomes ready. Crucial to prevent errors on initial render
        await this.waitForReady()

        const matched = this.registeredSchemas.filter(
            (schema) =>
                schema.matchesUrls.some((prefix) => nodeId.startsWith(prefix)) &&
                (this.spec ? schema.activeOnSpec.includes(this.spec) : true)
        )
        for (const registeredSchema of matched) {
            if (exclude.includes(registeredSchema.id)) continue

            try {
                const schema = await this.fetchSchema(registeredSchema.schemaUrl)
                if (schema === DedupedSymbol) continue // schema is already being fetched elsewhere in parallel
                loadedSchemas.set(registeredSchema.id, { schema })
            } catch (e) {
                console.error(`Failed to get schema with key ${registeredSchema.id}:`, e)
                loadedSchemas.set(registeredSchema.id, { error: e })
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

    updateRegisteredSchemas(
        state: SchemaResolverStore["registeredSchemas"],
        spec: RO_CRATE_VERSION
    ) {
        this.ready = true
        this.registeredSchemas = state
        this.spec = spec
    }

    async forceLoad(schemaId: string) {
        const schema = this.registeredSchemas.find((schema) => schema.id === schemaId)
        if (!schema) return
        const fetched = await this.fetchSchema(schema.schemaUrl)
        if (fetched === DedupedSymbol) return
        return fetched
    }

    loadAll(exclude: string[]) {
        const schemas = this.registeredSchemas
            .filter((schema) => !exclude.includes(schema.id))
            .filter((schema) => (this.spec ? schema.activeOnSpec.includes(this.spec) : true))
        return schemas.map((schema) => ({
            schema: schema,
            data: this.fetchSchema(schema.schemaUrl)
        }))
    }

    private async fetchSchema(url: string): Promise<SchemaFile | DedupedSymbol> {
        const existing = this.runningFetches.get(url)
        if (existing) {
            return existing.then(() => DedupedSymbol) // After the existing fetch is done, return with DedupedSymbol
            // Because the existing fetch will actually fetch the schema and add it to the editor store, we do not need to fetch it again.
            // We simply wait until the existing fetch is done.
        } else {
            const promise = fetch(url, {
                headers: { Accept: "text/turtle" }
            }).then(async (req) => {
                if (
                    req.headers.get("Content-Type") === "application/ld+json" ||
                    req.headers.get("Content-Type")?.startsWith("text/plain") // GitHub raw files are served as text/plain, will try to use JSON anyway
                ) {
                    const data = await req.json()
                    this.runningFetches.delete(url)
                    return schemaFileSchema.parse(data)
                } else if (req.headers.get("Content-Type")?.startsWith("text/turtle")) {
                    const ttl = await req.text()
                    const rawJson = parseTtl(ttl)

                    // Rewrite rdf:type style definitions to @type style definitions.
                    // Remove owl references, use rdf and rdfs.
                    rawJson["@graph"] = rawJson["@graph"].map((e) => {
                        if ("rdf:type" in e) {
                            e["@type"] = (e["rdf:type"] as IReference)["@id"]
                            if (e["@type"] === "owl:Class") {
                                e["@type"] = "rdfs:Class"
                            }
                            if (e["@type"] === "owl:ObjectProperty") {
                                e["@type"] = "rdf:Property"
                            }
                        }

                        return e
                    })

                    rawJson["@graph"] = rawJson["@graph"].filter((e) => "@type" in e)
                    this.runningFetches.delete(url)
                    return schemaFileSchema.parse(rawJson)
                } else throw new Error(`Invalid content type ${req.headers.get("Content-Type")}`)
            })
            this.runningFetches.set(url, promise)
            return promise
        }
    }
}
