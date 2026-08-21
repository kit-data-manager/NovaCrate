import { RO_CRATE_VERSION } from "@/lib/constants"
import { prependBasePath } from "@/lib/utils"
import { create } from "zustand"
import { persist, unstable_ssrSafe as ssrSafe } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"

/**
 * A registered schema that the schema resolver knows about.
 *
 * `displayName` is the unique identifier of the schema. `matchesUrls` defines
 * which entity/property IDs trigger loading of this schema (by URL prefix).
 * `url` is the built-in download URL of the schema, while `overrideUrl` lets the
 * user replace it. An empty `overrideUrl` means the default `url` is used.
 */
export interface KnownSchema {
    displayName: string
    matchesUrls: string[]
    url: string
    overrideUrl: string
    restrictTo: RO_CRATE_VERSION[]
    /** True for schemas that ship with NovaCrate (factory defaults). */
    builtIn: boolean
}

/**
 * Serializable subset of the schema resolver settings. This is the shape that
 * is allowed to cross into the schema web worker (functions are not
 * structured-cloneable and would make `postMessage` throw).
 */
export interface SchemaResolverSettingsData {
    preloadKnownSchemas: boolean
    allowUnknownSchemas: boolean
    knownSchemas: KnownSchema[]
}

export interface SchemaResolverSettings extends SchemaResolverSettingsData {
    setPreloadKnownSchemas(to: boolean): void
    setAllowUnknownSchemas(to: boolean): void
    setKnownSchemas(schemas: KnownSchema[]): void

    /**
     * Add a new schema entry. If an entry with the same display name already exists, it is updated.
     */
    addSchema(schema: KnownSchema): void

    /**
     * Update a schema entry. It is possible to change the display name using the schema parameter
     */
    updateSchema(displayName: string, schema: KnownSchema): void
    deleteSchema(displayName: string): void

    /** Restores a built-in schema to the factory default settings. */
    resetSchemaToDefault(displayName: string): void
}

/** Extracts the serializable settings that may be sent to the schema worker. */
export function toSchemaResolverSettingsData(
    settings: SchemaResolverSettingsData
): SchemaResolverSettingsData {
    return {
        preloadKnownSchemas: settings.preloadKnownSchemas,
        allowUnknownSchemas: settings.allowUnknownSchemas,
        knownSchemas: settings.knownSchemas
    }
}

const ALL_SPECS = [RO_CRATE_VERSION.V1_1_3, RO_CRATE_VERSION.V1_2_0, RO_CRATE_VERSION.V1_3_0]

function cloneKnownSchemas(schemas: KnownSchema[]): KnownSchema[] {
    return schemas.map((schema) => ({
        ...schema,
        matchesUrls: [...schema.matchesUrls],
        restrictTo: [...schema.restrictTo]
    }))
}

export const DEFAULT_KNOWN_SCHEMAS: KnownSchema[] = [
    {
        displayName: "Schema.org",
        matchesUrls: ["https://schema.org/"],
        url: "https://schema.org/version/latest/schemaorg-current-https.jsonld",
        overrideUrl: "",
        restrictTo: [RO_CRATE_VERSION.V1_1_3, RO_CRATE_VERSION.V1_2_0, RO_CRATE_VERSION.V1_3_0],
        builtIn: true
    },
    {
        displayName: "Bioschemas.org Types",
        matchesUrls: ["https://bioschemas.org/"],
        url: "https://bioschemas.org/types/bioschemas_types.jsonld",
        overrideUrl: "",
        restrictTo: [RO_CRATE_VERSION.V1_1_3, RO_CRATE_VERSION.V1_2_0, RO_CRATE_VERSION.V1_3_0],
        builtIn: true
    },
    {
        displayName: "DCMI",
        matchesUrls: ["http://purl.org/dc/terms/"],
        url: "https://www.dublincore.org/specifications/dublin-core/dcmi-terms/dublin_core_terms.ttl",
        overrideUrl: "",
        restrictTo: [RO_CRATE_VERSION.V1_1_3, RO_CRATE_VERSION.V1_2_0, RO_CRATE_VERSION.V1_3_0],
        builtIn: true
    },
    {
        displayName: "Profile Vocabulary",
        matchesUrls: ["http://www.w3.org/ns/dx/prof"],
        // Resolvable per term via content negotiation, no download URL needed.
        url: "",
        overrideUrl: "",
        restrictTo: [RO_CRATE_VERSION.V1_2_0, RO_CRATE_VERSION.V1_3_0],
        builtIn: true
    },
    {
        displayName: "GeoSPARQL",
        matchesUrls: ["http://www.opengis.net/ont/geosparql"],
        url: "https://raw.githubusercontent.com/opengeospatial/ogc-geosparql/master/geosparql-next/rdf/ontologies/geo.ttl",
        overrideUrl: "",
        restrictTo: [RO_CRATE_VERSION.V1_2_0, RO_CRATE_VERSION.V1_3_0],
        builtIn: true
    },
    {
        displayName: "CodeMeta 3.0",
        matchesUrls: ["https://codemeta.github.io/terms/"],
        url: prependBasePath("schema/codemeta-3.0-terms.jsonld"),
        overrideUrl: "",
        restrictTo: [RO_CRATE_VERSION.V1_2_0, RO_CRATE_VERSION.V1_3_0],
        builtIn: true
    },
    {
        displayName: "Portland Common Data Model",
        matchesUrls: ["http://pcdm.org/models#"],
        url: prependBasePath("schema/pcdm-selected.jsonld"),
        overrideUrl: "",
        restrictTo: [RO_CRATE_VERSION.V1_1_3, RO_CRATE_VERSION.V1_2_0, RO_CRATE_VERSION.V1_3_0],
        builtIn: true
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
    const defaultForName = DEFAULT_KNOWN_SCHEMAS.find(
        (d) => d.displayName === registered.displayName
    )
    const defaultUrl = defaultForName?.url ?? ""
    const url = defaultForName ? defaultUrl : (registered.schemaUrl ?? "")
    const overrideUrl =
        defaultForName && registered.schemaUrl && registered.schemaUrl !== defaultUrl
            ? registered.schemaUrl
            : ""

    return {
        displayName: registered.displayName,
        matchesUrls: Array.isArray(registered.matchesUrls) ? registered.matchesUrls : [],
        url,
        overrideUrl,
        restrictTo:
            registered.activeOnSpec && registered.activeOnSpec.length > 0
                ? registered.activeOnSpec
                : (defaultForName?.restrictTo ?? [...ALL_SPECS]),
        builtIn: defaultForName !== undefined
    }
}

/** Shape persisted before version 4 (still carried a separate `id`). */
interface PersistedKnownSchemaV3 {
    id?: string
    displayName?: string
    matchesUrls?: string[]
    url?: string
    overrideUrl?: string
    restrictTo?: RO_CRATE_VERSION[]
    builtIn?: boolean
}

const normalizeKnownSchema = (entry: PersistedKnownSchemaV3): KnownSchema => {
    const displayName = entry.displayName || entry.id || "Schema"
    const defaultForName = DEFAULT_KNOWN_SCHEMAS.find((d) => d.displayName === displayName)
    return {
        displayName,
        matchesUrls: Array.isArray(entry.matchesUrls) ? entry.matchesUrls : [""],
        url: entry.url ?? "",
        overrideUrl: entry.overrideUrl ?? "",
        restrictTo:
            entry.restrictTo && entry.restrictTo.length > 0 ? entry.restrictTo : [...ALL_SPECS],
        builtIn: entry.builtIn === true || defaultForName !== undefined
    }
}

const uniqueByName = (schemas: KnownSchema[]): KnownSchema[] => {
    const byName = new Map<string, KnownSchema>()
    for (const schema of schemas) {
        if (!byName.has(schema.displayName)) byName.set(schema.displayName, schema)
    }
    return [...byName.values()]
}

/**
 * Migrates persisted settings from previous `schema-resolver` store versions
 * to the current shape (`knownSchemas` without a separate id). The store
 * persists under the same key so existing user data is preserved.
 */
export function migrateSchemaResolverSettings(
    persistedValue: unknown,
    persistedVersion: number
): Partial<SchemaResolverSettings> {
    const raw =
        persistedValue && typeof persistedValue === "object"
            ? (persistedValue as Record<string, unknown>)
            : null

    if (raw && Array.isArray(raw.registeredSchemas)) {
        const existing = uniqueByName(
            (raw.registeredSchemas as PersistedRegisteredSchema[]).map(toKnownSchema)
        )
        const missingDefaults = DEFAULT_KNOWN_SCHEMAS.filter(
            (defaultSchema) => !existing.some((s) => s.displayName === defaultSchema.displayName)
        )
        return { knownSchemas: [...existing, ...cloneKnownSchemas(missingDefaults)] }
    }

    if (raw && Array.isArray(raw.knownSchemas)) {
        return {
            knownSchemas: uniqueByName(
                (raw.knownSchemas as PersistedKnownSchemaV3[]).map(normalizeKnownSchema)
            )
        }
    }

    return { knownSchemas: cloneKnownSchemas(DEFAULT_KNOWN_SCHEMAS) }
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
                        const existing = state.knownSchemas.find(
                            (s) => s.displayName === schema.displayName
                        )
                        if (existing) {
                            state.knownSchemas[state.knownSchemas.indexOf(existing)] = schema
                        } else {
                            state.knownSchemas.push(schema)
                        }
                    })
                },
                updateSchema(displayName: string, schema: KnownSchema) {
                    set((state) => {
                        const i = state.knownSchemas.findIndex((s) => s.displayName === displayName)
                        if (i === -1) state.knownSchemas.push(schema)
                        else state.knownSchemas[i] = schema
                    })
                },
                deleteSchema(displayName: string) {
                    set((state) => {
                        state.knownSchemas = state.knownSchemas.filter(
                            (s) => s.displayName !== displayName
                        )
                    })
                },
                resetSchemaToDefault(displayName: string) {
                    set((state) => {
                        const defaultSchema = DEFAULT_KNOWN_SCHEMAS.find(
                            (d) => d.displayName === displayName
                        )
                        if (!defaultSchema) return
                        const i = state.knownSchemas.findIndex((s) => s.displayName === displayName)
                        if (i === -1) return
                        state.knownSchemas[i] = cloneKnownSchemas([defaultSchema])[0]
                    })
                }
            })),
            {
                name: "schema-resolver",
                version: 4,
                migrate: (persisted, version) => migrateSchemaResolverSettings(persisted, version)
            }
        )
    )
)
