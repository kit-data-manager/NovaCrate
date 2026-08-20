/**
 * @jest-environment jsdom
 */

import { RO_CRATE_VERSION } from "@/lib/constants"
import {
    DEFAULT_KNOWN_SCHEMAS,
    KnownSchema,
    findKnownSchema,
    findKnownSchemas,
    getEffectiveSchemaUrl,
    migrateSchemaResolverSettings,
    toSchemaResolverSettingsData,
    useSchemaResolverSettings
} from "@/lib/state/schema-resolver-settings"

function resetStore() {
    useSchemaResolverSettings.setState({
        preloadKnownSchemas: true,
        allowUnknownSchemas: false,
        knownSchemas: []
    })
}

const SCHEMA_ORG = DEFAULT_KNOWN_SCHEMAS.find((s) => s.id === "schema")!

function schemaWith(id: string, overrides: Partial<KnownSchema> = {}): KnownSchema {
    return {
        id,
        displayName: id,
        matchesUrls: [`https://${id}.example/`],
        url: `https://${id}.example/terms.jsonld`,
        overrideUrl: "",
        restrictTo: [RO_CRATE_VERSION.V1_1_3, RO_CRATE_VERSION.V1_2_0],
        ...overrides
    }
}

describe("toSchemaResolverSettingsData", () => {
    it("returns a serializable payload that contains no functions", () => {
        const state = useSchemaResolverSettings.getState()
        const data = toSchemaResolverSettingsData(state)

        expect(Object.keys(data).sort()).toEqual([
            "allowUnknownSchemas",
            "knownSchemas",
            "preloadKnownSchemas"
        ])
        expect(data.preloadKnownSchemas).toBe(state.preloadKnownSchemas)
        expect(data.allowUnknownSchemas).toBe(state.allowUnknownSchemas)
        expect(data.knownSchemas).toEqual(state.knownSchemas)
        expect(Object.values(data).some((v) => typeof v === "function")).toBe(false)
        expect(JSON.parse(JSON.stringify(data))).toEqual(data)
    })
})

describe("useSchemaResolverSettings", () => {
    beforeEach(() => {
        resetStore()
    })

    describe("initial state", () => {
        it("should enable preloading and disable unknown schema fetching by default", () => {
            const state = useSchemaResolverSettings.getState()
            expect(state.preloadKnownSchemas).toBe(true)
            expect(state.allowUnknownSchemas).toBe(false)
        })
    })

    describe("setPreloadKnownSchemas / setAllowUnknownSchemas", () => {
        it("should update the toggles", () => {
            useSchemaResolverSettings.getState().setPreloadKnownSchemas(false)
            useSchemaResolverSettings.getState().setAllowUnknownSchemas(true)
            const state = useSchemaResolverSettings.getState()
            expect(state.preloadKnownSchemas).toBe(false)
            expect(state.allowUnknownSchemas).toBe(true)
        })
    })

    describe("addSchema", () => {
        it("should add a new schema", () => {
            useSchemaResolverSettings.getState().addSchema(schemaWith("custom"))
            expect(useSchemaResolverSettings.getState().knownSchemas).toEqual([schemaWith("custom")])
        })

        it("should update the schema when the id already exists", () => {
            useSchemaResolverSettings.getState().addSchema(schemaWith("custom"))
            useSchemaResolverSettings
                .getState()
                .addSchema(schemaWith("custom", { displayName: "Renamed" }))
            expect(useSchemaResolverSettings.getState().knownSchemas).toEqual([
                schemaWith("custom", { displayName: "Renamed" })
            ])
        })
    })

    describe("updateSchema", () => {
        it("should update an existing schema", () => {
            useSchemaResolverSettings.getState().addSchema(schemaWith("custom"))
            useSchemaResolverSettings
                .getState()
                .updateSchema("custom", schemaWith("custom", { overrideUrl: "https://mirror/x" }))
            expect(useSchemaResolverSettings.getState().knownSchemas[0].overrideUrl).toBe(
                "https://mirror/x"
            )
        })

        it("should add the schema when the id is unknown", () => {
            useSchemaResolverSettings.getState().updateSchema("unknown", schemaWith("unknown"))
            expect(useSchemaResolverSettings.getState().knownSchemas).toEqual([schemaWith("unknown")])
        })
    })

    describe("deleteSchema", () => {
        it("should remove the schema with the matching id", () => {
            useSchemaResolverSettings.getState().addSchema(schemaWith("custom"))
            useSchemaResolverSettings.getState().deleteSchema("custom")
            expect(useSchemaResolverSettings.getState().knownSchemas).toEqual([])
        })

        it("should be a no-op for unknown ids", () => {
            useSchemaResolverSettings.getState().deleteSchema("does-not-exist")
            expect(useSchemaResolverSettings.getState().knownSchemas).toEqual([])
        })
    })
})

describe("DEFAULT_KNOWN_SCHEMAS", () => {
    it("is active on the latest RO-Crate version", () => {
        expect(DEFAULT_KNOWN_SCHEMAS.length).toBeGreaterThan(0)
        for (const schema of DEFAULT_KNOWN_SCHEMAS) {
            expect(schema.restrictTo).toContain(RO_CRATE_VERSION.V1_3_0)
        }
    })
})

describe("findKnownSchemas", () => {
    it("should match a term by URL prefix", () => {
        const result = findKnownSchemas(DEFAULT_KNOWN_SCHEMAS, "https://schema.org/Person")
        expect(result.map((s) => s.id)).toEqual(["schema"])
    })

    it("should match every schema that prefixes the term", () => {
        const custom = schemaWith("custom", { matchesUrls: ["https://schema.org/"] })
        const result = findKnownSchemas([...DEFAULT_KNOWN_SCHEMAS, custom], "https://schema.org/Person")
        expect(result.map((s) => s.id)).toEqual(["schema", "custom"])
    })

    it("should return no matches for an unknown prefix", () => {
        expect(findKnownSchemas(DEFAULT_KNOWN_SCHEMAS, "https://unknown.example/Thing")).toEqual([])
    })

    it("should filter schemas by the target spec", () => {
        const term = "http://www.opengis.net/ont/geosparql"
        expect(findKnownSchemas(DEFAULT_KNOWN_SCHEMAS, term, RO_CRATE_VERSION.V1_1_3)).toEqual([])
        expect(findKnownSchemas(DEFAULT_KNOWN_SCHEMAS, term, RO_CRATE_VERSION.V1_2_0).map((s) => s.id)).toEqual(
            ["geosparql"]
        )
    })

    it("should not filter by spec when none is given", () => {
        const result = findKnownSchemas(DEFAULT_KNOWN_SCHEMAS, "https://schema.org/Dataset")
        expect(result.map((s) => s.id)).toEqual(["schema"])
    })

    it("should match every term when an empty prefix is configured", () => {
        const result = findKnownSchemas([schemaWith("always", { matchesUrls: [""] })], "https://anything.example/x")
        expect(result.map((s) => s.id)).toEqual(["always"])
    })
})

describe("findKnownSchema", () => {
    it("should return the first matching schema", () => {
        const result = findKnownSchema(DEFAULT_KNOWN_SCHEMAS, "https://schema.org/Person")
        expect(result?.id).toBe("schema")
    })

    it("should return undefined when nothing matches", () => {
        expect(findKnownSchema(DEFAULT_KNOWN_SCHEMAS, "https://unknown.example/x")).toBeUndefined()
    })
})

describe("getEffectiveSchemaUrl", () => {
    it("should prefer the override URL when set", () => {
        expect(
            getEffectiveSchemaUrl({ url: "https://default/x", overrideUrl: "https://mirror/x" })
        ).toBe("https://mirror/x")
    })

    it("should fall back to the default URL when the override is empty", () => {
        expect(getEffectiveSchemaUrl({ url: "https://default/x", overrideUrl: "" })).toBe(
            "https://default/x"
        )
    })

    it("should treat whitespace-only overrides as empty", () => {
        expect(getEffectiveSchemaUrl({ url: "https://default/x", overrideUrl: "   " })).toBe(
            "https://default/x"
        )
    })
})

describe("migrateSchemaResolverSettings", () => {
    it("should seed the defaults when nothing is persisted", () => {
        const result = migrateSchemaResolverSettings(null, 0)
        expect(result.knownSchemas?.map((s) => s.id)).toEqual(DEFAULT_KNOWN_SCHEMAS.map((s) => s.id))
    })

    it("should map v2 registeredSchemas into knownSchemas", () => {
        const result = migrateSchemaResolverSettings(
            {
                registeredSchemas: [
                    {
                        id: "schema",
                        displayName: "Schema.org",
                        matchesUrls: ["https://schema.org/"],
                        schemaUrl: SCHEMA_ORG.url,
                        activeOnSpec: [RO_CRATE_VERSION.V1_2_0]
                    }
                ]
            },
            2
        )
        const schema = result.knownSchemas?.find((s) => s.id === "schema")
        expect(schema?.url).toBe(SCHEMA_ORG.url)
        expect(schema?.overrideUrl).toBe("")
        expect(schema?.restrictTo).toEqual([RO_CRATE_VERSION.V1_2_0])
    })

    it("should store a customized download URL in overrideUrl", () => {
        const custom = "https://mirror.example/schemaorg.jsonld"
        const result = migrateSchemaResolverSettings(
            {
                registeredSchemas: [
                    {
                        id: "schema",
                        displayName: "Schema.org",
                        matchesUrls: ["https://schema.org/"],
                        schemaUrl: custom,
                        activeOnSpec: [RO_CRATE_VERSION.V1_2_0]
                    }
                ]
            },
            2
        )
        const schema = result.knownSchemas?.find((s) => s.id === "schema")
        expect(schema?.url).toBe(SCHEMA_ORG.url)
        expect(schema?.overrideUrl).toBe(custom)
    })

    it("should keep user-added schemas in url and default the spec restrictions", () => {
        const result = migrateSchemaResolverSettings(
            {
                registeredSchemas: [
                    {
                        id: "custom",
                        displayName: "Custom",
                        matchesUrls: ["https://custom.example/"],
                        schemaUrl: "https://custom.example/terms.ttl"
                    }
                ]
            },
            1
        )
        const schema = result.knownSchemas?.find((s) => s.id === "custom")
        expect(schema?.url).toBe("https://custom.example/terms.ttl")
        expect(schema?.overrideUrl).toBe("")
        expect(schema?.restrictTo).toEqual([
            RO_CRATE_VERSION.V1_1_3,
            RO_CRATE_VERSION.V1_2_0,
            RO_CRATE_VERSION.V1_3_0
        ])
    })

    it("should add default schemas that are missing from persisted data", () => {
        const result = migrateSchemaResolverSettings(
            {
                registeredSchemas: [
                    {
                        id: "schema",
                        displayName: "Schema.org",
                        matchesUrls: ["https://schema.org/"],
                        schemaUrl: SCHEMA_ORG.url
                    }
                ]
            },
            1
        )
        const ids = result.knownSchemas?.map((s) => s.id) ?? []
        for (const defaultSchema of DEFAULT_KNOWN_SCHEMAS) {
            expect(ids).toContain(defaultSchema.id)
        }
    })

    it("should pass through an already-migrated v3 payload", () => {
        const knownSchemas = [schemaWith("custom")]
        const result = migrateSchemaResolverSettings({ knownSchemas }, 3)
        expect(result.knownSchemas).toEqual(knownSchemas)
    })
})
