import { SchemaFile, schemaFileSchema } from "./types"
import type { SchemaResolverStore } from "../state/schema-resolver"
import { parse as parseTtl } from "@frogcat/ttl2jsonld"
import { RO_CRATE_VERSION } from "@/lib/constants"

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
                loadedSchemas.set(registeredSchema.id, { schema })
            } catch (e) {
                console.error(`Failed to get schema with key ${registeredSchema.id}:`, e)
                loadedSchemas.set(registeredSchema.id, { error: e })
            }
        }

        return loadedSchemas
    }

    private async waitForReady() {
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
            } else return this.waitingForReady
        }
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
        return this.fetchSchema(schema.schemaUrl)
    }

    private fetchSchema(url: string): Promise<SchemaFile> {
        const existing = this.runningFetches.get(url)
        if (existing) {
            return existing
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
                } else if (req.headers.get("Content-Type") === "text/turtle") {
                    const ttl = await req.text()
                    const rawJson = parseTtl(ttl)
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
