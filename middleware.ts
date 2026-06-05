import { NextRequest, NextResponse } from "next/server"
import { RateLimiter } from "@/lib/ai/rate-limiter"
import { validateOrigin } from "@/lib/ai/validate-origin"

/**
 * Rate limiters — module-level singletons so they persist across requests
 * for the lifetime of the server process.
 */
const chatLimiter = new RateLimiter(20, 60_000) // 20 req / min
const generalLimiter = new RateLimiter(10, 60_000) // 10 req / min

/**
 * Extract a client identifier for rate limiting.
 * Prefers the standard `x-forwarded-for` header (set by most reverse
 * proxies), then falls back to `NextRequest.ip`, and finally to a
 * constant so rate limiting still works (shared across all unknown IPs).
 */
function getClientIp(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for")
    if (forwarded) {
        // x-forwarded-for can be a comma-separated list; take the first (client) IP
        return forwarded.split(",")[0].trim()
    }
    return "unknown"
}

/**
 * Derive the expected origin from the incoming request.
 * Uses the Host header and protocol so it works in any deployment
 * without hardcoding a domain.
 */
function getAllowedOrigin(req: NextRequest): string {
    const proto = req.headers.get("x-forwarded-proto") ?? "https"
    const host = req.headers.get("host")
    return `${proto}://${host}`
}

export function middleware(req: NextRequest) {
    // --- 1. Origin check ---
    const origin = req.headers.get("origin")
    const allowed = getAllowedOrigin(req)

    if (!validateOrigin(origin, allowed)) {
        return NextResponse.json(
            { error: "Forbidden: invalid or missing Origin header" },
            { status: 403 }
        )
    }

    // --- 2. Rate limiting ---
    const ip = getClientIp(req)
    const isChat = req.nextUrl.pathname.endsWith("/ai/chat")
    const limiter = isChat ? chatLimiter : generalLimiter
    const result = limiter.check(ip)

    if (!result.allowed) {
        const retryAfterSeconds = Math.ceil((result.retryAfterMs ?? 1000) / 1000)
        return NextResponse.json(
            { error: "Too many requests, please try again later" },
            {
                status: 429,
                headers: {
                    "Retry-After": String(retryAfterSeconds)
                }
            }
        )
    }

    return NextResponse.next()
}

/**
 * Only run this middleware on /api/ai/* routes.
 * Next.js automatically prepends basePath to the matcher, so we
 * match against the path without it.
 */
export const config = {
    matcher: "/api/ai/:path*"
}
