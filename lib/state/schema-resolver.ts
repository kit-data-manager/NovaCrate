import { create } from "zustand/index"
import { immer } from "zustand/middleware/immer"
import { persist } from "zustand/middleware"
import { enableMapSet } from "immer"
import { RO_CRATE_VERSION } from "@/lib/constants"

export interface RegisteredSchema {
    id: string
    displayName: string
    matchesUrls: string[]
    schemaUrl: string
    activeOnSpec: RO_CRATE_VERSION[]
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

const defaultSchemas = [
    {
        id: "schema",
        displayName: "Schema.org",
        matchesUrls: ["https://schema.org/"],
        schemaUrl: "https://schema.org/version/latest/schemaorg-current-https.jsonld",
        activeOnSpec: [RO_CRATE_VERSION.V1_1_3, RO_CRATE_VERSION.V1_2_0]
    },
    {
        id: "bioschemas",
        displayName: "Bioschemas.org",
        matchesUrls: ["https://bioschemas.org/"],
        schemaUrl:
            "https://raw.githubusercontent.com/BioSchemas/specifications/refs/heads/master/ComputationalWorkflow/jsonld/ComputationalWorkflow_v0.5-DRAFT-2020_07_21.json",
        activeOnSpec: [RO_CRATE_VERSION.V1_1_3]
    },
    {
        id: "bioschemas-v1.0",
        displayName: "Bioschemas.org v1.0",
        matchesUrls: ["https://bioschemas.org/"],
        schemaUrl:
            "https://raw.githubusercontent.com/BioSchemas/specifications/refs/heads/master/ComputationalWorkflow/jsonld/ComputationalWorkflow_v1.0-RELEASE.json",
        activeOnSpec: [RO_CRATE_VERSION.V1_2_0]
    },
    {
        id: "bioschemas_types",
        displayName: "Bioschemas.org Types",
        matchesUrls: ["https://bioschemas.org/"],
        schemaUrl: "https://bioschemas.org/types/bioschemas_types.jsonld",
        activeOnSpec: [RO_CRATE_VERSION.V1_1_3, RO_CRATE_VERSION.V1_2_0]
    },
    {
        id: "dcmi",
        displayName: "DCMI",
        matchesUrls: ["http://purl.org/dc/terms/"],
        schemaUrl:
            "https://www.dublincore.org/specifications/dublin-core/dcmi-terms/dublin_core_terms.ttl",
        activeOnSpec: [RO_CRATE_VERSION.V1_1_3, RO_CRATE_VERSION.V1_2_0]
    }
]

export const schemaResolverStore = create<SchemaResolverStore>()(
    persist(
        immer((set, get) => ({
            registeredSchemas: structuredClone(defaultSchemas),

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
        {
            name: "schema-resolver",
            version: 2,
            migrate: (_persisted: unknown, persistedVersion) => {
                if (!_persisted) return { registeredSchemas: [...defaultSchemas] }
                const persisted = _persisted as Partial<SchemaResolverStore>
                const existing = Array.isArray(persisted?.registeredSchemas)
                    ? [...persisted!.registeredSchemas!]
                    : []
                // Drop any stale default entries by id, then append the new defaults
                const merged = [
                    ...existing.filter((s) => !defaultSchemas.some((d) => d.id === s.id)),
                    ...structuredClone(defaultSchemas)
                ]

                // activeOnSpec was added in version 2 of the store
                if (persistedVersion < 2) {
                    for (const schema of merged) {
                        const defaults = defaultSchemas.find((d) => d.id === schema.id)
                        if (defaults && !schema.activeOnSpec) {
                            schema.activeOnSpec = defaults.activeOnSpec
                        } else if (!schema.activeOnSpec) {
                            // Activate on all specs if the actual spec usage is unknown
                            schema.activeOnSpec = [RO_CRATE_VERSION.V1_1_3, RO_CRATE_VERSION.V1_2_0]
                        }
                    }

                    if (!merged.find((s) => s.id === "bioschemas-v1.0"))
                        merged.push(defaultSchemas.find((d) => d.id === "bioschemas-v1.0")!)
                }

                return { registeredSchemas: merged }
            }
        }
    )
)
