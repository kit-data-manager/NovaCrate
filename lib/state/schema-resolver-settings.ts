import { RO_CRATE_VERSION } from "@/lib/constants"
import { addBasePath } from "next/dist/client/add-base-path"
import { create } from "zustand"
import { persist, unstable_ssrSafe as ssrSafe } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"

/**
 * A registered schema that the schema resolver knows about.
 *
 * `matchesUrls` defines which entity/property IDs trigger loading of this schema
 * (by URL prefix). `url` is the built-in download URL of the schema, while
 * `overrideUrl` lets the user replace it. An empty `overrideUrl` means the
 * default `url` is used.
 */
export interface KnownSchema {
    id: string
    displayName: string
    matchesUrls: string[]
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

    /**
     * Add a new schema entry. If an entry with the same id already exists, it is updated.
     */
    addSchema(schema: KnownSchema): void

    /**
     * Update a schema entry. It is possible to change the schema id using the second parameter
     */
    updateSchema(id: string, schema: KnownSchema): void
    deleteSchema(id: string): void
}

const ALL_SPECS = [RO_CRATE_VERSION.V1_1_3, RO_CRATE_VERSION.V1_2_0]

function cloneKnownSchemas(schemas: KnownSchema[]): KnownSchema[] {
    return schemas.map((schema) => ({
        ...schema,
        matchesUrls: [...schema.matchesUrls],
        restrictTo: [...schema.restrictTo]
    }))
}

export const DEFAULT_KNOWN_SCHEMAS: KnownSchema[] = [
    {
        id: "schema",
        displayName: "Schema.org",
        matchesUrls: ["https://schema.org/"],
        url: "https://schema.org/version/latest/schemaorg-current-https.jsonld",
        overrideUrl: "",
        restrictTo: [RO_CRATE_VERSION.V1_1_3, RO_CRATE_VERSION.V1_2_0]
    },
    {
        id: "bioschemas_types",
        displayName: "Bioschemas.org Types",
        matchesUrls: ["https://bioschemas.org/"],
        url: "https://bioschemas.org/types/bioschemas_types.jsonld",
        overrideUrl: "",
        restrictTo: [RO_CRATE_VERSION.V1_1_3, RO_CRATE_VERSION.V1_2_0]
    },
    {
        id: "dcmi",
        displayName: "DCMI",
        matchesUrls: ["http://purl.org/dc/terms/"],
        url: "https://www.dublincore.org/specifications/dublin-core/dcmi-terms/dublin_core_terms.ttl",
        overrideUrl: "",
        restrictTo: [RO_CRATE_VERSION.V1_1_3, RO_CRATE_VERSION.V1_2_0]
    },
    {
        id: "prof-voc",
        displayName: "Profile Vocabulary",
        matchesUrls: ["http://www.w3.org/ns/dx/prof"],
        url: "https://www.w3.org/TR/dx-prof/rdf/prof.ttl",
        overrideUrl: "",
        restrictTo: [RO_CRATE_VERSION.V1_2_0]
    },
    {
        id: "geosparql",
        displayName: "GeoSPARQL",
        matchesUrls: ["http://www.opengis.net/ont/geosparql"],
        url: "https://opengeospatial.github.io/ogc-geosparql/geosparql11/geo.ttl",
        overrideUrl: "",
        restrictTo: [RO_CRATE_VERSION.V1_2_0]
    },
    {
        id: "codemeta3",
        displayName: "CodeMeta 3.0",
        matchesUrls: ["https://codemeta.github.io/terms/"],
        url: addBasePath("schema/codemeta-3.0-terms.jsonld"),
        overrideUrl: "",
        restrictTo: [RO_CRATE_VERSION.V1_2_0]
    },
    {
        id: "pcdm",
        displayName: "Portland Common Data Model",
        matchesUrls: ["http://pcdm.org/models#"],
        url: addBasePath("schema/pcdm-selected.jsonld"),
        overrideUrl: "",
        restrictTo: [RO_CRATE_VERSION.V1_1_3, RO_CRATE_VERSION.V1_2_0]
    }
]

/** The download URL the resolver should use for a schema: the override wins, otherwise the default. */
export function getEffectiveSchemaUrl(schema: Pick<KnownSchema, "url" | "overrideUrl">): string {
    return schema.overrideUrl.trim() || schema.url
}

/**
 * Returns all known schemas that match the given term URL.
 *
 * A schema matches when the term is prefixed by any entry of `matchesUrls`
 * (an empty prefix matches every term). If a `spec` is given, only schemas
 * active on that spec are returned; schemas without restrictions match all specs.
 */
export function findKnownSchemas(
    schemas: KnownSchema[],
    term: string,
    spec?: RO_CRATE_VERSION
): KnownSchema[] {
    return schemas.filter((schema) => {
        if (!schema.matchesUrls.some((prefix) => term.startsWith(prefix))) return false
        if (spec == null) return true
        return schema.restrictTo.length === 0 || schema.restrictTo.includes(spec)
    })
}

/** Returns the first {@link findKnownSchemas} match, if any. */
export function findKnownSchema(
    schemas: KnownSchema[],
    term: string,
    spec?: RO_CRATE_VERSION
): KnownSchema | undefined {
    return findKnownSchemas(schemas, term, spec)[0]
}

interface PersistedRegisteredSchema {
    id: string
    displayName: string
    matchesUrls?: string[]
    schemaUrl?: string
    activeOnSpec?: RO_CRATE_VERSION[]
    [key: string]: unknown
}

const toKnownSchema = (registered: PersistedRegisteredSchema): KnownSchema => {
    const defaultForId = DEFAULT_KNOWN_SCHEMAS.find((d) => d.id === registered.id)
    const defaultUrl = defaultForId?.url ?? ""
    const url = defaultForId ? defaultUrl : registered.schemaUrl ?? ""
    const overrideUrl =
        defaultForId && registered.schemaUrl && registered.schemaUrl !== defaultUrl
            ? registered.schemaUrl
            : ""

    return {
        id: registered.id,
        displayName: registered.displayName,
        matchesUrls: Array.isArray(registered.matchesUrls) ? registered.matchesUrls : [],
        url,
        overrideUrl,
        restrictTo:
            registered.activeOnSpec && registered.activeOnSpec.length > 0
                ? registered.activeOnSpec
                : defaultForId?.restrictTo ?? [...ALL_SPECS]
    }
}

/**
 * Migrates persisted settings from the previous `schema-resolver` store
 * (version 1/2, `registeredSchemas`) to the current shape (`knownSchemas`).
 * The store persists under the same key so existing user data is preserved.
 */
export function migrateSchemaResolverSettings(
    persistedValue: unknown,
    persistedVersion: number
): Partial<SchemaResolverSettings> {
    const raw =
        persistedValue && typeof persistedValue === "object"
            ? (persistedValue as Record<string, unknown>)
            : null

    if (persistedVersion >= 3 && raw) {
        if (Array.isArray(raw.knownSchemas)) {
            return { knownSchemas: raw.knownSchemas as KnownSchema[] }
        }
        return { knownSchemas: cloneKnownSchemas(DEFAULT_KNOWN_SCHEMAS) }
    }

    const existing = raw && Array.isArray(raw.registeredSchemas)
        ? (raw.registeredSchemas as PersistedRegisteredSchema[]).map(toKnownSchema)
        : []

    const missingDefaults = DEFAULT_KNOWN_SCHEMAS.filter(
        (defaultSchema) => !existing.some((s) => s.id === defaultSchema.id)
    )

    return { knownSchemas: [...existing, ...missingDefaults] }
}

export const useSchemaResolverSettings = create<SchemaResolverSettings>()(
    ssrSafe(
        persist(
            immer((set) => ({
                preloadKnownSchemas: true,
                setPreloadKnownSchemas(to: boolean) {
                    set((state) => {
                        state.preloadKnownSchemas = to
                    })
                },
                allowUnknownSchemas: false,
                setAllowUnknownSchemas(to: boolean) {
                    set((state) => {
                        state.allowUnknownSchemas = to
                    })
                },
                knownSchemas: cloneKnownSchemas(DEFAULT_KNOWN_SCHEMAS),
                setKnownSchemas(schemas: KnownSchema[]) {
                    set((state) => {
                        state.knownSchemas = schemas
                    })
                },
                addSchema(schema: KnownSchema) {
                    set((state) => {
                        const existing = state.knownSchemas.find((s) => s.id === schema.id)
                        if (existing) {
                            state.knownSchemas[state.knownSchemas.indexOf(existing)] = schema
                        } else {
                            state.knownSchemas.push(schema)
                        }
                    })
                },
                updateSchema(id: string, schema: KnownSchema) {
                    set((state) => {
                        const i = state.knownSchemas.findIndex((s) => s.id === id)
                        if (i === -1) state.knownSchemas.push(schema)
                        else state.knownSchemas[i] = schema
                    })
                },
                deleteSchema(id: string) {
                    set((state) => {
                        state.knownSchemas = state.knownSchemas.filter((s) => s.id !== id)
                    })
                }
            })),
            {
                name: "schema-resolver",
                version: 3,
                migrate: (persisted, version) => migrateSchemaResolverSettings(persisted, version)
            }
        )
    )
)
