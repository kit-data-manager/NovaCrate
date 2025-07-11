import { SchemaFile, schemaFileSchema } from "./types"
import type { SchemaResolverStore } from "../state/schema-resolver"

export class SchemaResolver {
    constructor(private schemaResolverState: SchemaResolverStore) {}

    async autoload(exclude: string[]) {
        // Load schemas on demand? Currently, all schemas are always loaded
        return await this.loadRegisteredSchemas(exclude)
    }

    async loadRegisteredSchemas(exclude: string[]) {
        const loadedSchemas: Map<string, { schema?: SchemaFile; error?: unknown }> = new Map()

        for (const [key, registeredSchema] of this.schemaResolverState.registeredSchemas) {
            if (exclude.includes(key)) continue

            try {
                const schema = await this.fetchSchema(registeredSchema.schemaUrl)
                loadedSchemas.set(key, { schema })
            } catch (e) {
                console.error(`Failed to get schema with key ${key}:`, e)
                loadedSchemas.set(key, { error: e })
            }
        }

        return loadedSchemas
    }

    updateState(state: SchemaResolverStore) {
        this.schemaResolverState = state
    }

    private async fetchSchema(url: string): Promise<SchemaFile> {
        const req = await fetch(url)
        const data = await req.json()
        return schemaFileSchema.parse(data)
    }
}
