/**
 * @jest-environment jsdom
 */

import { SchemaResolver, getTermBase } from "@/lib/schema-worker/SchemaResolver"
import { RO_CRATE_VERSION } from "@/lib/constants"
import { KnownSchema, SchemaResolverSettingsData } from "@/lib/state/schema-resolver-settings"

const SPEC = RO_CRATE_VERSION.V1_2_0

function knownSchema(id: string, url: string): KnownSchema {
    return {
        id,
        displayName: id,
        matchesUrls: ["https://vocab.example/"],
        url,
        overrideUrl: "",
        restrictTo: [SPEC]
    }
}

function jsonSchemaFor(ids: string[]): string {
    return JSON.stringify({
        "@context": { rdfs: "http://www.w3.org/2000/01/rdf-schema#" },
        "@graph": ids.map((id, i) => ({
            "@id": id,
            "@type": i % 2 === 0 ? "rdfs:Class" : "rdf:Property"
        }))
    })
}

function mockFetchForUrls(map: Record<string, { status?: number; body?: string }>) {
    global.fetch = jest.fn(async (input: unknown) => {
        const url = new URL(String(input), "http://localhost").searchParams.get("url") ?? ""
        const entry = map[url]
        const payload = !entry
            ? { error: "Not found", attempts: [] }
            : entry.status && entry.status >= 400
              ? { error: `HTTP ${entry.status}` }
              : {
                    url,
                    resolvedUrl: url,
                    contentType: "application/ld+json",
                    format: "jsonld",
                    content: entry.body,
                    cachedAt: new Date().toISOString()
                }
        return { json: async () => payload, status: entry?.status ?? 200 } as Response
    })
    return global.fetch as jest.Mock
}

function makeResolver(
    data: Partial<SchemaResolverSettingsData> = {}
): {
    resolver: SchemaResolver
    knownSchemas: KnownSchema[]
} {
    const knownSchemas = data.knownSchemas ?? []
    const settings: SchemaResolverSettingsData = {
        knownSchemas,
        preloadKnownSchemas: data.preloadKnownSchemas ?? false,
        allowUnknownSchemas: data.allowUnknownSchemas ?? false
    }
    const resolver = new SchemaResolver(settings)
    resolver.updateRegisteredSchemas(settings, SPEC)
    return { resolver, knownSchemas }
}

const originalFetch = global.fetch

beforeEach(() => {
    jest.useFakeTimers()
})

afterEach(() => {
    global.fetch = originalFetch
    jest.clearAllTimers()
})

describe("getTermBase", () => {
    it("splits on the last slash for path-based vocabularies", () => {
        expect(getTermBase("https://schema.org/Person")).toBe("https://schema.org/")
    })

    it("splits on the last hash for fragment-based vocabularies", () => {
        expect(getTermBase("http://pcdm.org/models#File")).toBe("http://pcdm.org/models#")
    })

    it("keeps prof terms in the namespace", () => {
        expect(getTermBase("http://www.w3.org/ns/dx/prof/Profile")).toBe(
            "http://www.w3.org/ns/dx/prof/"
        )
    })
})

describe("autoload with known schemas that have a download URL", () => {
    it("fetches the whole schema file from the known URL", async () => {
        const schema = knownSchema("vocab", "https://vocab.example/all.jsonld")
        const { resolver } = makeResolver({ knownSchemas: [schema] })
        const fetchMock = mockFetchForUrls({
            "https://vocab.example/all.jsonld": {
                body: jsonSchemaFor(["https://vocab.example/Person"])
            }
        })

        const result = await resolver.autoload("https://vocab.example/Person", [])

        expect(result.get("vocab")?.schema).toBeDefined()
        expect(fetchMock).toHaveBeenCalledTimes(1)
    })
})

describe("autoload with known schemas without a download URL", () => {
    it("batches terms that share a base into a single base request", async () => {
        const schema = knownSchema("vocab", "")
        const { resolver } = makeResolver({ knownSchemas: [schema] })
        const terms = [
            "https://vocab.example/Person",
            "https://vocab.example/Organization",
            "https://vocab.example/name"
        ]
        const fetchMock = mockFetchForUrls({
            "https://vocab.example/": { body: jsonSchemaFor(terms) }
        })

        const pending = [
            resolver.autoload(terms[0], []),
            resolver.autoload(terms[1], []),
            resolver.autoload(terms[2], [])
        ]
        await jest.advanceTimersByTimeAsync(100)
        const [r1, r2, r3] = await Promise.all(pending)

        for (const result of [r1, r2, r3]) {
            expect(result.get("https://vocab.example/")?.schema).toBeDefined()
        }
        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(fetchMock.mock.calls[0][0]).toContain(encodeURIComponent("https://vocab.example/"))
    })

    it("falls back to per-term fetches when the base does not resolve", async () => {
        const schema = knownSchema("vocab", "")
        const { resolver } = makeResolver({ knownSchemas: [schema] })
        const fetchMock = mockFetchForUrls({
            "https://vocab.example/": { status: 502 },
            "https://vocab.example/Person": {
                body: jsonSchemaFor(["https://vocab.example/Person"])
            }
        })

        const promise = resolver.autoload("https://vocab.example/Person", [])
        await jest.advanceTimersByTimeAsync(100)
        const result = await promise

        expect(result.get("https://vocab.example/Person")?.schema).toBeDefined()
        expect(fetchMock).toHaveBeenCalledTimes(2)
    })
})

describe("autoload with unknown schemas", () => {
    it("batches unknown terms sharing a base when allowed", async () => {
        const { resolver } = makeResolver({ allowUnknownSchemas: true })
        const terms = ["https://vocab.example/Person", "https://vocab.example/Organization"]
        const fetchMock = mockFetchForUrls({
            "https://vocab.example/": { body: jsonSchemaFor(terms) }
        })

        const pending = [resolver.autoload(terms[0], []), resolver.autoload(terms[1], [])]
        await jest.advanceTimersByTimeAsync(100)
        const [r1, r2] = await Promise.all(pending)

        expect(r1.get("https://vocab.example/")?.schema).toBeDefined()
        expect(r2.get("https://vocab.example/")?.schema).toBeDefined()
        expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it("does not fetch unknown terms when unknown schemas are not allowed", async () => {
        const { resolver } = makeResolver()
        const fetchMock = mockFetchForUrls({})

        const result = await resolver.autoload("https://vocab.example/Person", [])

        expect(result.size).toBe(0)
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it("upgrades http term URLs to https before fetching", async () => {
        const { resolver } = makeResolver({ allowUnknownSchemas: true })
        const fetchMock = mockFetchForUrls({
            "https://vocab.example/": { body: jsonSchemaFor(["http://vocab.example/Person"]) }
        })

        const promise = resolver.autoload("http://vocab.example/Person", [])
        await jest.advanceTimersByTimeAsync(100)
        await promise

        const requestedUrl =
            new URL(String(fetchMock.mock.calls[0][0]), "http://localhost").searchParams.get(
                "url"
            ) ?? ""
        expect(requestedUrl).toBe("https://vocab.example/")
        expect(fetchMock).toHaveBeenCalledTimes(1)
    })
})

describe("loadAll", () => {
    it("only preloads known schemas that have a download URL", async () => {
        const withUrl = knownSchema("with-url", "https://vocab.example/all.jsonld")
        const withoutUrl = knownSchema("without-url", "")
        const { resolver } = makeResolver({ knownSchemas: [withUrl, withoutUrl] })

        const all = resolver.loadAll([])

        expect(all.map((entry) => entry.schema.id)).toEqual(["with-url"])
    })
})
