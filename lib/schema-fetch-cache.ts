import type { SchemaFetchResult } from "@/lib/schema-worker/types"

export interface SchemaFetchCacheOptions {
    /** How long entries are kept in milliseconds. Defaults to 24 hours. */
    ttlMs?: number
    /** Maximum number of cached schemas. Defaults to 100. */
    maxEntries?: number
    /** Maximum content size in bytes that may be cached. Defaults to 10 MiB. */
    maxBytes?: number
}

interface CacheEntry {
    schema: SchemaFetchResult
    storedAt: number
}

/**
 * Bounded in-memory cache for externally fetched schemas.
 *
 * Entries expire after {@link ttlMs}. When the cache exceeds {@link maxEntries}
 * the least recently used entry is evicted. Content larger than {@link maxBytes}
 * is never stored.
 *
 * Not shared across processes or serverless instances.
 */
export class SchemaFetchCache {
    private readonly entries = new Map<string, CacheEntry>()
    private readonly ttlMs: number
    private readonly maxEntries: number
    private readonly maxBytes: number

    constructor(options: SchemaFetchCacheOptions = {}) {
        this.ttlMs = options.ttlMs ?? 24 * 60 * 60 * 1000
        this.maxEntries = options.maxEntries ?? 100
        this.maxBytes = options.maxBytes ?? 10 * 1024 * 1024
    }

    get size(): number {
        return this.entries.size
    }

    get(key: string): SchemaFetchResult | null {
        const entry = this.entries.get(key)
        if (!entry) return null

        if (Date.now() - entry.storedAt > this.ttlMs) {
            this.entries.delete(key)
            return null
        }

        // Refresh recency so the entry is evicted last.
        this.entries.delete(key)
        this.entries.set(key, entry)

        return entry.schema
    }

    set(key: string, schema: SchemaFetchResult): void {
        const bytes = new TextEncoder().encode(schema.content).byteLength
        if (bytes > this.maxBytes) return

        this.evictExpired()
        this.entries.delete(key)
        this.entries.set(key, { schema, storedAt: Date.now() })

        while (this.entries.size > this.maxEntries) {
            const oldestKey = this.entries.keys().next().value
            if (oldestKey === undefined) break
            this.entries.delete(oldestKey)
        }
    }

    clear(): void {
        this.entries.clear()
    }

    private evictExpired(): void {
        const now = Date.now()
        for (const [key, entry] of this.entries) {
            if (now - entry.storedAt > this.ttlMs) {
                this.entries.delete(key)
            }
        }
    }
}
