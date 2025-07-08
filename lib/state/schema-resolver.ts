import { SchemaFile } from "@/lib/schema-worker/types"
import { create } from "zustand/index"
import { immer } from "zustand/middleware/immer"
import { persist } from "zustand/middleware"

export interface RegisteredSchema {
    url: string
    cached?: SchemaFile
    cachedAt?: number
    error?: unknown
}

export interface SchemaResolverStore {
    registeredSchemas: Map<string, RegisteredSchema>
}

export const schemaResolverStore = create<SchemaResolverStore>()(
    persist(
        immer((set, get) => ({
            registeredSchemas: new Map<string, RegisteredSchema>()
        })),
        { name: "schema-resolver" }
    )
)
