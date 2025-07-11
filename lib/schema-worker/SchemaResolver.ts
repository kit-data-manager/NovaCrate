import { SchemaFile, schemaFileSchema } from "./types"
import type { SchemaResolverStore } from "../state/schema-resolver"

export class SchemaResolver {
    constructor(private registeredSchemas: SchemaResolverStore["registeredSchemas"]) {}

    async autoload(exclude: string[]) {
        // Load schemas on demand? Currently, all schemas are always loaded
        return await this.loadRegisteredSchemas(exclude)
    }

    async loadRegisteredSchemas(exclude: string[]) {
        const loadedSchemas: Map<string, { schema?: SchemaFile; error?: unknown }> = new Map()

        for (const registeredSchema of this.registeredSchemas) {
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

    private async fetchSchema(url: string): Promise<SchemaFile> {
        const req = await fetch(url)
        const data = await req.json()
        return schemaFileSchema.parse(data)
    }
}
