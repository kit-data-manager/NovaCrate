import { SchemaFile, schemaFileSchema } from "./types"
import type { SchemaResolverStore } from "../state/schema-resolver"

export class SchemaResolver {
    private runningFetches: Map<string, Promise<SchemaFile>> = new Map()

    constructor(private registeredSchemas: SchemaResolverStore["registeredSchemas"]) {}

    async autoload(nodeId: string, exclude: string[]) {
        const loadedSchemas: Map<string, { schema?: SchemaFile; error?: unknown }> = new Map()

        const matched = this.registeredSchemas.filter((schema) =>
            schema.matchesUrls.some((prefix) => nodeId.startsWith(prefix))
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

    updateRegisteredSchemas(state: SchemaResolverStore["registeredSchemas"]) {
        this.registeredSchemas = state
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
            const promise = fetch(url).then(async (req) => {
                const data = await req.json()
                this.runningFetches.delete(url)
                return schemaFileSchema.parse(data)
            })
            this.runningFetches.set(url, promise)
            return promise
        }
    }
}
