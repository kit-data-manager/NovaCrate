import { RateLimiter } from "@/lib/ai/rate-limiter"

describe("RateLimiter", () => {
    it("should allow requests under the limit", () => {
        const limiter = new RateLimiter(3, 60_000)
        const now = 1000

        expect(limiter.check("ip-a", now).allowed).toBe(true)
        expect(limiter.check("ip-a", now + 1).allowed).toBe(true)
        expect(limiter.check("ip-a", now + 2).allowed).toBe(true)
    })

    it("should reject the request that exceeds the limit", () => {
        const limiter = new RateLimiter(2, 60_000)
        const now = 1000

        expect(limiter.check("ip-a", now).allowed).toBe(true)
        expect(limiter.check("ip-a", now + 1).allowed).toBe(true)
        expect(limiter.check("ip-a", now + 2).allowed).toBe(false)
    })

    it("should return retryAfterMs when over the limit", () => {
        const limiter = new RateLimiter(1, 10_000)
        const now = 50_000

        limiter.check("ip-a", now)
        const result = limiter.check("ip-a", now + 100)

        expect(result.allowed).toBe(false)
        expect(result.retryAfterMs).toBeDefined()
        // The oldest entry is at `now`. The window ends at (now + 100) - 10_000 = now - 9_900.
        // retryAfterMs = now - (now - 9_900) = 9_900
        expect(result.retryAfterMs).toBe(9_900)
    })

    it("should allow requests again after the window expires", () => {
        const limiter = new RateLimiter(2, 1_000)
        const now = 10_000

        expect(limiter.check("ip-a", now).allowed).toBe(true)
        expect(limiter.check("ip-a", now + 100).allowed).toBe(true)
        expect(limiter.check("ip-a", now + 200).allowed).toBe(false)

        // After the window has passed, requests should be allowed again
        expect(limiter.check("ip-a", now + 1_001).allowed).toBe(true)
    })

    it("should track keys independently", () => {
        const limiter = new RateLimiter(1, 60_000)
        const now = 1000

        expect(limiter.check("ip-a", now).allowed).toBe(true)
        expect(limiter.check("ip-a", now + 1).allowed).toBe(false)

        // Different key should not be affected
        expect(limiter.check("ip-b", now + 2).allowed).toBe(true)
        expect(limiter.check("ip-b", now + 3).allowed).toBe(false)
    })

    it("should handle a burst then recovery correctly", () => {
        const limiter = new RateLimiter(3, 1_000)
        const now = 5_000

        // Fill up the limit
        limiter.check("ip-a", now)
        limiter.check("ip-a", now + 100)
        limiter.check("ip-a", now + 200)

        // Over limit
        expect(limiter.check("ip-a", now + 300).allowed).toBe(false)

        // First entry expires at now + 1_000, so at now + 1_001 one slot opens
        expect(limiter.check("ip-a", now + 1_001).allowed).toBe(true)
        // But immediately after, limit is full again
        expect(limiter.check("ip-a", now + 1_002).allowed).toBe(false)
    })

    it("should prune old entries to prevent memory leaks", () => {
        const limiter = new RateLimiter(2, 100)
        const now = 1000

        limiter.check("ip-a", now)
        limiter.check("ip-a", now + 50)

        // After a long time, both entries should be pruned
        const result = limiter.check("ip-a", now + 200)
        expect(result.allowed).toBe(true)
    })

    it("should handle the first request for a new key", () => {
        const limiter = new RateLimiter(5, 60_000)
        const result = limiter.check("brand-new-key")
        expect(result.allowed).toBe(true)
        expect(result.retryAfterMs).toBeUndefined()
    })
})
