/**
 * Environment-configured allowlist for schema fetch URLs.
 *
 * Deployment operators restrict which URLs the schema fetch API may request
 * via `SCHEMA_FETCH_ALLOWED_URLS`, a whitespace- or comma-separated list of
 * glob patterns matched against the full URL (case-insensitively). When the
 * variable is not set, a secure default allowlist covering the built-in
 * registered schemas is used, so existing deployments keep working.
 */

export const SCHEMA_FETCH_ALLOWED_URLS_ENV = "SCHEMA_FETCH_ALLOWED_URLS"

/**
 * Allowlist used when `SCHEMA_FETCH_ALLOWED_URLS` is not set. Covers the
 * hosts of all built-in registered schemas.
 */
export const DEFAULT_SCHEMA_FETCH_ALLOWED_URLS =
    "https://schema.org/** https://bioschemas.org/** https://www.dublincore.org/** " +
    "https://www.w3.org/ns/dx/prof/** https://raw.githubusercontent.com/opengeospatial/** " +
    "http://pcdm.org/models#**"

/**
 * Converts a glob pattern into an anchored regular expression.
 *
 * - `*` matches any characters except `/`
 * - `**` matches any characters, including `/`
 * - `?` matches any single character except `/`
 * - all other characters are matched literally
 *
 * Matching is case-insensitive.
 */
export function globToRegExp(glob: string): RegExp {
    let pattern = ""
    for (let i = 0; i < glob.length; i++) {
        const char = glob[i]
        if (char === "*") {
            if (glob[i + 1] === "*") {
                i++
                pattern += ".*"
            } else {
                pattern += "[^/]*"
            }
        } else if (char === "?") {
            pattern += "[^/]"
        } else {
            pattern += escapeRegExpChar(char)
        }
    }
    return new RegExp(`^${pattern}$`, "i")
}

/**
 * Returns the effective allowlist globs, split and trimmed. Falls back to the
 * secure default allowlist when the environment variable is not set.
 */
export function getSchemaFetchAllowedGlobs(): string[] {
    const raw = process.env[SCHEMA_FETCH_ALLOWED_URLS_ENV]
    return splitGlobs(raw?.trim() ? raw : DEFAULT_SCHEMA_FETCH_ALLOWED_URLS)
}

export function isSchemaFetchUrlAllowed(url: URL): boolean {
    return getSchemaFetchAllowedGlobs().some((glob) => globToRegExp(glob).test(url.toString()))
}

/**
 * Throws when the given schema URL is not allowed by the deployment allowlist.
 */
export function assertSchemaFetchUrlAllowed(url: URL): void {
    if (isSchemaFetchUrlAllowed(url)) return
    throw new Error(`Schema URL is not allowed on this deployment: ${url.toString()}`)
}

function splitGlobs(raw: string): string[] {
    return raw
        .split(/[\s,]+/)
        .map((pattern) => pattern.trim())
        .filter(Boolean)
}

function escapeRegExpChar(char: string): string {
    return /[\\^$.*+?()[\]{}|]/.test(char) ? `\\${char}` : char
}
