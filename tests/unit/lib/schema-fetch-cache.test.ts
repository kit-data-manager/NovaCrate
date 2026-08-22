import { SchemaFetchCache } from "@/lib/schema-fetch-cache"
import { SchemaFetchResult } from "@/lib/schema-worker/types"

function result(content: string): SchemaFetchResult {
    return {
        url: "https://schema.example/",
        resolvedUrl: "https://schema.example/",
        contentType: "application/ld+json",
        format: "jsonld",
        content,
        cachedAt: new Date().toISOString()
    }
}

describe("SchemaFetchCache", () => {
    describe("get", () => {
        it("returns null for unknown keys", () => {
            const cache = new SchemaFetchCache()
            expect(cache.get("https://schema.example/")).toBeNull()
        })

        it("returns a cached schema", () => {
            const cache = new SchemaFetchCache()
            const schema = result("{}")
            cache.set("https://schema.example/", schema)
            expect(cache.get("https://schema.example/")).toEqual(schema)
        })
    })

    describe("TTL", () => {
        beforeEach(() => {
            jest.useFakeTimers()
        })

        afterEach(() => {
            jest.useRealTimers()
        })

        it("serves entries within the TTL", () => {
            const cache = new SchemaFetchCache({ ttlMs: 1000 })
            cache.set("a", result("1"))

            jest.advanceTimersByTime(999)
            expect(cache.get("a")).not.toBeNull()
        })

        it("expires entries after the TTL", () => {
            const cache = new SchemaFetchCache({ ttlMs: 1000 })
            cache.set("a", result("1"))
            expect(cache.get("a")).not.toBeNull()

            jest.advanceTimersByTime(1001)
            expect(cache.get("a")).toBeNull()
        })

        it("drops expired entries when new entries are stored", () => {
            const cache = new SchemaFetchCache({ ttlMs: 1000 })
            cache.set("a", result("1"))

            jest.advanceTimersByTime(2000)
            cache.set("b", result("2"))

            expect(cache.get("a")).toBeNull()
            expect(cache.get("b")).not.toBeNull()
        })
    })

    describe("size limits", () => {
        it("does not cache content larger than maxBytes", () => {
            const cache = new SchemaFetchCache({ maxBytes: 4 })
            cache.set("a", result("12345"))
            expect(cache.get("a")).toBeNull()
        })

        it("caches content up to maxBytes", () => {
            const cache = new SchemaFetchCache({ maxBytes: 4 })
            cache.set("a", result("1234"))
            expect(cache.get("a")).not.toBeNull()
        })

        it("evicts the least recently used entry when full", () => {
            const cache = new SchemaFetchCache({ maxEntries: 2 })
            cache.set("a", result("1"))
            cache.set("b", result("2"))
            cache.get("a")
            cache.set("c", result("3"))

            expect(cache.get("a")).not.toBeNull()
            expect(cache.get("b")).toBeNull()
            expect(cache.get("c")).not.toBeNull()
        })

        it("updates an existing key without evicting another entry", () => {
            const cache = new SchemaFetchCache({ maxEntries: 2 })
            cache.set("a", result("1"))
            cache.set("b", result("2"))
            cache.set("a", result("3"))

            expect(cache.get("a")).not.toBeNull()
            expect(cache.get("b")).not.toBeNull()
        })
    })

    describe("clear", () => {
        it("removes all entries", () => {
            const cache = new SchemaFetchCache()
            cache.set("a", result("1"))
            cache.clear()
            expect(cache.get("a")).toBeNull()
        })
    })
})
