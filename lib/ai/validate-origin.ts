/**
 * Validates that a request's Origin header matches the expected origin of
 * the application.
 *
 * Rules:
 *  - If the Origin header is missing (null), the request is rejected.
 *  - Comparison is case-insensitive and ignores trailing slashes.
 *
 * @param origin         Value of the Origin header (null when absent).
 * @param allowedOrigin  The origin this application is served from
 *                       (e.g. "https://novacrate.example.com").
 * @returns true if the origin is valid, false otherwise.
 */
export function validateOrigin(origin: string | null, allowedOrigin: string): boolean {
    if (origin === null) return false

    const normalize = (s: string) => s.toLowerCase().replace(/\/+$/, "")
    return normalize(origin) === normalize(allowedOrigin)
}
