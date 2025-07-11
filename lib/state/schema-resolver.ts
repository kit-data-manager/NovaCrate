import { create } from "zustand/index"
import { immer } from "zustand/middleware/immer"
import { persist } from "zustand/middleware"
import { enableMapSet } from "immer"

export interface RegisteredSchema {
    matchesUrls: string[]
    schemaUrl: string
}

export interface SchemaResolverStore {
    registeredSchemas: Map<string, RegisteredSchema>
}

enableMapSet()

export const schemaResolverStore = create<SchemaResolverStore>()(
    persist(
        immer((set, get) => ({
            registeredSchemas: new Map<string, RegisteredSchema>(
                Object.entries({
                    schema: {
                        matchesUrls: ["https://schema.org/"],
                        schemaUrl:
                            "https://schema.org/version/latest/schemaorg-current-https.jsonld"
                    }
                })
            )
        })),
        { name: "schema-resolver" }
    )
)
