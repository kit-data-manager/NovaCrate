import { create } from "zustand/index"
import { immer } from "zustand/middleware/immer"
import { persist } from "zustand/middleware"
import { enableMapSet } from "immer"

export interface RegisteredSchema {
    id: string
    displayName: string
    matchesUrls: string[]
    schemaUrl: string
}

export interface SchemaResolverStore {
    registeredSchemas: Array<RegisteredSchema>

    /**
     * Deletes all entries matching the provided ID
     * @param id
     */
    deleteSchema: (id: string) => void

    /**
     * Add a new schema entry. If an entry with the same name already exists, it is updated.
     * @param schema
     */
    addSchema: (schema: RegisteredSchema) => void

    /**
     * Update a schema entry. It is possible to change the schema ID using the second parameter
     * @param id ID of the schema to change
     * @param schema Updated data for the schema. Providing a different ID here than in the first parameter will change the ID
     */
    updateSchema: (id: string, schema: RegisteredSchema) => void
}

enableMapSet()

export const schemaResolverStore = create<SchemaResolverStore>()(
    persist(
        immer((set, get) => ({
            registeredSchemas: [
                {
                    id: "schema",
                    displayName: "Schema.org",
                    matchesUrls: ["https://schema.org/"],
                    schemaUrl: "https://schema.org/version/latest/schemaorg-current-https.jsonld"
                }
            ],

            deleteSchema: (name: string) => {
                set((draft) => {
                    draft.registeredSchemas = draft.registeredSchemas.filter(
                        (schema) => schema.id !== name
                    )
                })
            },

            addSchema: (schema: RegisteredSchema) => {
                if (get().registeredSchemas.find((s) => s.id === schema.id)) {
                    return get().updateSchema(schema.id, schema)
                }

                set((draft) => {
                    draft.registeredSchemas.push(schema)
                })
            },

            updateSchema: (id: string, schema: RegisteredSchema) => {
                set((draft) => {
                    const i = draft.registeredSchemas.findIndex((s) => s.id === id)
                    draft.registeredSchemas[i] = schema
                })
            }
        })),
        { name: "schema-resolver" }
    )
)
