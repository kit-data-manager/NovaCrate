export const SCHEMA_FETCH_CACHE_CONTROL =
    "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=31536000"
export const SCHEMA_FETCH_REVALIDATE_SECONDS = 2592000

const MAX_SCHEMA_BYTES = 10 * 1024 * 1024

type SchemaFormat = "jsonld" | "turtle"

interface FetchAttempt {
    accept: string
    format: SchemaFormat
}

export interface FetchFailure {
    accept: string
    error: string
    status?: number
}

export interface SchemaFetchResult {
    url: string
    resolvedUrl: string
    contentType: string | null
    format: SchemaFormat
    content: string
    cachedAt: string
}

const FETCH_ATTEMPTS: FetchAttempt[] = [
    { accept: "application/ld+json", format: "jsonld" },
    { accept: "text/turtle", format: "turtle" }
]

export async function GET(req: Request) {
    const requestUrl = new URL(req.url)
    const schemaUrl = requestUrl.searchParams.get("url")

    if (!schemaUrl) {
        return Response.json({ error: "Bad Request" }, { status: 400 })
    }

    let url: URL
    try {
        url = validateSchemaUrl(schemaUrl)
    } catch (error) {
        return Response.json(
            { error: error instanceof Error ? error.message : "Invalid schema URL" },
            { status: 400 }
        )
    }

    const result = await fetchSchemaWithNegotiation(url)
    if (!result.ok) {
        return Response.json(
            {
                error: "Failed to fetch schema as JSON-LD or Turtle",
                attempts: result.failures
            },
            { status: 502 }
        )
    }

    return Response.json(result.schema, {
        headers: {
            "Cache-Control": SCHEMA_FETCH_CACHE_CONTROL
        }
    })
}

export function validateSchemaUrl(input: string): URL {
    let url: URL
    try {
        url = new URL(input)
    } catch {
        throw new Error("Invalid schema URL")
    }

    if (url.protocol !== "https:") {
        throw new Error("Schema URL must use https")
    }

    if (url.username || url.password) {
        throw new Error("Schema URL must not include credentials")
    }

    if (url.hostname === "localhost" || url.hostname.endsWith(".localhost")) {
        throw new Error("Schema URL must not target localhost")
    }

    if (isIPv4(url.hostname) || isIPv6(url.hostname)) {
        throw new Error("Schema URL must use a domain name")
    }

    return url
}

async function fetchSchemaWithNegotiation(
    url: URL
): Promise<{ ok: true; schema: SchemaFetchResult } | { ok: false; failures: FetchFailure[] }> {
    const failures: FetchFailure[] = []

    for (const attempt of FETCH_ATTEMPTS) {
        try {
            const response = await fetch(url, {
                headers: {
                    Accept: attempt.accept
                },
                cache: "force-cache",
                next: { revalidate: SCHEMA_FETCH_REVALIDATE_SECONDS }
            })

            if (!response.ok) {
                failures.push({
                    accept: attempt.accept,
                    status: response.status,
                    error: response.statusText || `HTTP ${response.status}`
                })
                continue
            }

            const contentType = response.headers.get("Content-Type")
            if (!isExpectedContentType(contentType, attempt.format)) {
                failures.push({
                    accept: attempt.accept,
                    status: response.status,
                    error: `Unexpected content type ${contentType ?? "unknown"}`
                })
                continue
            }

            const content = await readLimitedText(response)
            return {
                ok: true,
                schema: {
                    url: url.toString(),
                    resolvedUrl: response.url || url.toString(),
                    contentType,
                    format: attempt.format,
                    content,
                    cachedAt: new Date().toISOString()
                }
            }
        } catch (error) {
            failures.push({
                accept: attempt.accept,
                error: error instanceof Error ? error.message : JSON.stringify(error)
            })
        }
    }

    return { ok: false, failures }
}

function isExpectedContentType(contentType: string | null, format: SchemaFormat): boolean {
    if (!contentType) return false

    const mimeType = contentType.split(";")[0].trim().toLowerCase()
    if (format === "jsonld")
        return (
            mimeType === "application/ld+json" ||
            mimeType === "application/json" ||
            mimeType === "text/plain"
        ) // GitHub returns everything as text/plain
    return mimeType === "text/turtle" || mimeType === "text/plain" // GitHub returns everything as text/plain
}

async function readLimitedText(response: Response): Promise<string> {
    const contentLength = response.headers.get("Content-Length")
    if (contentLength && Number(contentLength) > MAX_SCHEMA_BYTES) {
        throw new Error(`Schema response exceeds ${MAX_SCHEMA_BYTES} bytes`)
    }

    const content = await response.text()
    const size = new TextEncoder().encode(content).byteLength
    if (size > MAX_SCHEMA_BYTES) {
        throw new Error(`Schema response exceeds ${MAX_SCHEMA_BYTES} bytes`)
    }

    return content
}

function isIPv4(hostname: string): boolean {
    const parts = hostname.split(".")
    if (parts.length !== 4) return false

    return parts.every((part) => {
        if (!/^\d{1,3}$/.test(part)) return false
        const number = Number(part)
        return number >= 0 && number <= 255
    })
}

function isIPv6(hostname: string): boolean {
    return hostname.includes(":")
}
