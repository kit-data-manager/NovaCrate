/**
 * Validates a user-provided base URL for outbound AI provider requests.
 *
 * Rules:
 *  1. Protocol must be https.
 *  2. Hostname must be a domain name, not an IP address (v4 or v6).
 *  3. Connections to *.kit.edu are blocked (internal KIT network),
 *     except for the explicitly allowed host ki-toolbox.scc.kit.edu.
 *
 * Throws a descriptive Error when the URL is rejected.
 * Does nothing when `url` is undefined or empty (adapters fall back to
 * their own hardcoded defaults in that case).
 */
export function validateBaseUrl(url: string | undefined): void {
    if (!url) return

    let parsed: URL
    try {
        parsed = new URL(url)
    } catch {
        throw new Error(`Invalid base URL: "${url}" is not a valid URL`)
    }

    // 1. HTTPS only
    if (parsed.protocol !== "https:") {
        throw new Error(
            `Invalid base URL: protocol must be https, got ${parsed.protocol.replace(":", "")}`
        )
    }

    // 2. No IP addresses
    const hostname = parsed.hostname

    if (isIPv4(hostname)) {
        throw new Error("Invalid base URL: IP addresses are not allowed, use a domain name")
    }

    // URL normalises IPv6 to [::1] form; parsed.hostname strips the brackets
    if (isIPv6(hostname)) {
        throw new Error("Invalid base URL: IP addresses are not allowed, use a domain name")
    }

    // 3. Block *.kit.edu except ki-toolbox.scc.kit.edu
    const lower = hostname.toLowerCase()
    if (
        (lower === "kit.edu" || lower.endsWith(".kit.edu")) &&
        lower !== "ki-toolbox.scc.kit.edu"
    ) {
        throw new Error(
            "Invalid base URL: connections to kit.edu resources are not allowed, " +
                "except for ki-toolbox.scc.kit.edu"
        )
    }
}

/**
 * Returns true if the string is a valid IPv4 address (dotted-decimal).
 */
function isIPv4(hostname: string): boolean {
    // Must be 4 decimal octets separated by dots, each 0-255
    const parts = hostname.split(".")
    if (parts.length !== 4) return false
    return parts.every((part) => {
        if (!/^\d{1,3}$/.test(part)) return false
        const num = Number(part)
        return num >= 0 && num <= 255
    })
}

/**
 * Returns true if the string looks like an IPv6 address.
 * The URL constructor strips surrounding brackets from IPv6 literals,
 * so we check for the colon-hex format directly.
 */
function isIPv6(hostname: string): boolean {
    // IPv6 addresses always contain at least two colons (e.g. "::1", "fe80::1")
    // Domain names never contain colons.
    return hostname.includes(":")
}
