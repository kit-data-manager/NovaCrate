import { create } from "zustand/index"
import { immer } from "zustand/middleware/immer"
import { persist } from "zustand/middleware"
import { enableMapSet } from "immer"
import { RO_CRATE_VERSION } from "@/lib/constants"
import { addBasePath } from "next/dist/client/add-base-path"

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
    },
    /* Added in store version 2 */
    {
        id: "prof-voc",
        displayName: "Profile Vocabulary",
        matchesUrls: ["http://www.w3.org/ns/dx/prof"],
        schemaUrl: "https://www.w3.org/TR/dx-prof/rdf/prof.ttl",
        activeOnSpec: [RO_CRATE_VERSION.V1_2_0]
    },
    {
        id: "geosparql",
        displayName: "GeoSPARQL",
        matchesUrls: ["http://www.opengis.net/ont/geosparql"],
        schemaUrl: "https://opengeospatial.github.io/ogc-geosparql/geosparql11/geo.ttl",
        activeOnSpec: [RO_CRATE_VERSION.V1_2_0]
    },
    {
        id: "codemeta3",
        displayName: "CodeMeta 3.0",
        matchesUrls: ["https://codemeta.github.io/terms/"],
        schemaUrl: addBasePath("schema/codemeta-3.0-terms.jsonld"),
        activeOnSpec: [RO_CRATE_VERSION.V1_2_0]
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
                const merged = [...existing]

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

                    if (!merged.find((s) => s.id === "prof-voc"))
                        merged.push(defaultSchemas.find((d) => d.id === "prof-voc")!)

                    if (!merged.find((s) => s.id === "geosparql"))
                        merged.push(defaultSchemas.find((d) => d.id === "geosparql")!)

                    if (!merged.find((s) => s.id === "codemeta3"))
                        merged.push(defaultSchemas.find((d) => d.id === "codemeta3")!)
                }

                return { registeredSchemas: merged }
            }
        }
    )
)
