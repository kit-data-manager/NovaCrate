/**
 * Headers that must not be overridden by user-provided custom headers.
 * Compared case-insensitively.
 */
const BLOCKED_HEADERS: string[] = [
    // Auth — each adapter sets its own auth header; user input must not overwrite it
    "authorization",
    "x-api-key",
    "proxy-authorization",

    // Host / routing — can mislead reverse-proxies or the target server
    "host",
    "origin",
    "referer",

    // Proxy & forwarding — could spoof source identity
    "x-forwarded-for",
    "x-forwarded-host",
    "x-forwarded-proto",
    "x-real-ip",
    "forwarded",
    "via",

    // Cookie / session — should never leak to third-party providers
    "cookie",
    "set-cookie",
    "cookie2",
    "set-cookie2"
]

/**
 * Remove dangerous or security-sensitive headers from a user-provided header
 * record. Matching is case-insensitive.
 *
 * Returns a new object; the input is not mutated.
 */
export function sanitizeHeaders(
    headers: Record<string, string> | undefined
): Record<string, string> {
    if (!headers) return {}

    const blocked = new Set(BLOCKED_HEADERS)

    const sanitized: Record<string, string> = {}
    for (const [key, value] of Object.entries(headers)) {
        if (!blocked.has(key.toLowerCase())) {
            sanitized[key] = value
        }
    }
    return sanitized
}
