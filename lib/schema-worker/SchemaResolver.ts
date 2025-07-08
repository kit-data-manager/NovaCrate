import { SchemaFile, schemaFileSchema } from "./types"
import type { SchemaResolverStore } from "@/lib/state/schema-resolver"

export class SchemaResolver {
    async loadRegisteredSchemas(_store: SchemaResolverStore) {
        const store = structuredClone(_store)
        for (const [key, registeredSchema] of store.registeredSchemas) {
            try {
                if (registeredSchema.cached) continue

                const schema = await this.fetchSchema(registeredSchema.url)

                store.registeredSchemas.set(key, {
                    ...registeredSchema,
                    cached: schema,
                    cachedAt: Date.now(),
                    error: undefined
                })
            } catch (e) {
                store.registeredSchemas.set(key, {
                    ...registeredSchema,
                    error: e
                })
            }
        }

        return store
    }

    async fetchSchema(url: string): Promise<SchemaFile> {
        const req = await fetch(url)
        const data = await req.json()
        return schemaFileSchema.parse(data)
    }
}
