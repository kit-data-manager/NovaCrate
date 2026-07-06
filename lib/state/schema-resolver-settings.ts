import { RO_CRATE_VERSION } from "@/lib/constants"
import { create } from "zustand"

export interface KnownSchema {
    id: string
    url: string
    overrideUrl: string
    restrictTo: RO_CRATE_VERSION[]
}

export interface SchemaResolverSettings {
    preloadKnownSchemas: boolean
    setPreloadKnownSchemas(to: boolean): void
    allowUnknownSchemas: boolean
    setAllowUnknownSchemas(to: boolean): void
    knownSchemas: KnownSchema[]
    setKnownSchemas(schemas: KnownSchema[]): void
}

export const useSchemaResolverSettings = create<SchemaResolverSettings>()((set, get) => ({
    preloadKnownSchemas: true,
    setPreloadKnownSchemas(to: boolean) {
        set({ preloadKnownSchemas: to })
    },
    allowUnknownSchemas: false,
    setAllowUnknownSchemas(to: boolean) {
        set({ allowUnknownSchemas: to })
    },
    knownSchemas: [],
    setKnownSchemas(schemas: KnownSchema[]) {
        set({ knownSchemas: schemas })
    }
}))
