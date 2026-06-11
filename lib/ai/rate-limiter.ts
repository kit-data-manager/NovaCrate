/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Tracks request timestamps per key (typically an IP address) and
 * rejects requests that exceed the configured limit within the window.
 *
 * Not shared across processes — suitable for single-instance deployments.
 */
export class RateLimiter {
    private readonly requests = new Map<string, number[]>()

    /**
     * @param maxRequests  Maximum number of requests allowed within the window.
     * @param windowMs    Length of the sliding window in milliseconds.
     */
    constructor(
        private readonly maxRequests: number,
        private readonly windowMs: number
    ) {}

    /**
     * Check whether a request from `key` is allowed.
     *
     * @returns `allowed: true` if under the limit, otherwise `allowed: false`
     *          with `retryAfterMs` indicating how long until the oldest
     *          request in the window expires.
     */
    check(key: string, now: number = Date.now()): { allowed: boolean; retryAfterMs?: number } {
        const windowStart = now - this.windowMs
        const timestamps = this.requests.get(key)

        if (!timestamps) {
            this.requests.set(key, [now])
            return { allowed: true }
        }

        // Prune entries that have fallen outside the window
        const active = timestamps.filter((t) => t > windowStart)

        if (active.length < this.maxRequests) {
            active.push(now)
            this.requests.set(key, active)
            return { allowed: true }
        }

        // Over limit — calculate when the oldest entry will expire
        const retryAfterMs = active[0] - windowStart
        this.requests.set(key, active)
        return { allowed: false, retryAfterMs }
    }
}
