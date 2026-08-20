jest.mock("next/cache", () => ({
    unstable_cache: (callback: unknown) => callback
}))

import { GET, SCHEMA_FETCH_CACHE_CONTROL, validateSchemaUrl } from "@/lib/schema-fetch"

const originalFetch = global.fetch
const ORIGINAL_ALLOWED_URLS = process.env.SCHEMA_FETCH_ALLOWED_URLS

function setAllowedSchemaUrls(globs: string | undefined) {
    if (globs === undefined) {
        delete process.env.SCHEMA_FETCH_ALLOWED_URLS
    } else {
        process.env.SCHEMA_FETCH_ALLOWED_URLS = globs
    }
}

function mockFetch(...responses: Array<Response | Error>) {
    const mockedFetch = jest.fn()

    for (const response of responses) {
        if (response instanceof Error) {
            mockedFetch.mockRejectedValueOnce(response)
        } else {
            mockedFetch.mockResolvedValueOnce(response)
        }
    }

    global.fetch = mockedFetch as unknown as typeof fetch
    return mockedFetch
}

function schemaRequest(url: string | null) {
    const requestUrl = new URL("https://novacrate.example/api/schemas/fetch")
    if (url) requestUrl.searchParams.set("url", url)

    return new Request(requestUrl)
}

describe("schema fetch API", () => {
    beforeEach(() => {
        setAllowedSchemaUrls("https://schema.example/**")
    })

    afterEach(() => {
        global.fetch = originalFetch
    })

    afterAll(() => {
        setAllowedSchemaUrls(ORIGINAL_ALLOWED_URLS)
    })

    describe("validateSchemaUrl", () => {
        it("accepts https domain URLs", () => {
            expect(validateSchemaUrl("https://schema.example/terms.ttl").toString()).toBe(
                "https://schema.example/terms.ttl"
            )
        })

        it("rejects non-https URLs", () => {
            expect(() => validateSchemaUrl("http://schema.example/terms.ttl")).toThrow(
                "Schema URL must use https"
            )
        })

        it("rejects URLs with credentials", () => {
            expect(() => validateSchemaUrl("https://user:pass@schema.example/terms.ttl")).toThrow(
                "Schema URL must not include credentials"
            )
        })

        it("rejects localhost", () => {
            expect(() => validateSchemaUrl("https://localhost/terms.ttl")).toThrow(
                "Schema URL must not target localhost"
            )
        })

        it("rejects IP literals", () => {
            expect(() => validateSchemaUrl("https://127.0.0.1/terms.ttl")).toThrow(
                "Schema URL must use a domain name"
            )
        })
    })

    describe("GET", () => {
        it("rejects missing URLs", async () => {
            const response = await GET(schemaRequest(null))

            expect(response.status).toBe(400)
        })

        it("fetches JSON-LD first with only the server-controlled Accept header", async () => {
            const fetchMock = mockFetch(
                new Response('{"@context":{},"@graph":[]}', {
                    status: 200,
                    headers: { "Content-Type": "application/ld+json" }
                })
            )

            const response = await GET(schemaRequest("https://schema.example/terms"))
            const body = await response.json()

            expect(response.status).toBe(200)
            expect(response.headers.get("Cache-Control")).toBe(SCHEMA_FETCH_CACHE_CONTROL)
            expect(body).toMatchObject({
                url: "https://schema.example/terms",
                resolvedUrl: "https://schema.example/terms",
                contentType: "application/ld+json",
                format: "jsonld",
                content: '{"@context":{},"@graph":[]}'
            })
            expect(fetchMock).toHaveBeenCalledTimes(1)
            expect(fetchMock).toHaveBeenCalledWith(new URL("https://schema.example/terms"), {
                headers: { Accept: "application/ld+json" },
                cache: "force-cache",
                next: { revalidate: 86400 }
            })
        })

        it("falls back to Turtle when JSON-LD fails", async () => {
            const fetchMock = mockFetch(
                new Response("Not Found", { status: 404, statusText: "Not Found" }),
                new Response("@prefix schema: <https://schema.org/> .", {
                    status: 200,
                    headers: { "Content-Type": "text/turtle" }
                })
            )

            const response = await GET(schemaRequest("https://schema.example/terms"))
            const body = await response.json()

            expect(response.status).toBe(200)
            expect(body.format).toBe("turtle")
            expect(body.content).toBe("@prefix schema: <https://schema.org/> .")
            expect(fetchMock).toHaveBeenNthCalledWith(1, new URL("https://schema.example/terms"), {
                headers: { Accept: "application/ld+json" },
                cache: "force-cache",
                next: { revalidate: 86400 }
            })
            expect(fetchMock).toHaveBeenNthCalledWith(2, new URL("https://schema.example/terms"), {
                headers: { Accept: "text/turtle" },
                cache: "force-cache",
                next: { revalidate: 86400 }
            })
        })

        it("falls back when the JSON-LD response has the wrong content type", async () => {
            mockFetch(
                new Response("<html></html>", {
                    status: 200,
                    headers: { "Content-Type": "text/html" }
                }),
                new Response("@prefix schema: <https://schema.org/> .", {
                    status: 200,
                    headers: { "Content-Type": "text/turtle; charset=utf-8" }
                })
            )

            const response = await GET(schemaRequest("https://schema.example/terms"))
            const body = await response.json()

            expect(response.status).toBe(200)
            expect(body.format).toBe("turtle")
        })

        it("fails when both content negotiations fail", async () => {
            mockFetch(
                new Response("Not Found", { status: 404, statusText: "Not Found" }),
                new Error("Network failed")
            )

            const response = await GET(schemaRequest("https://schema.example/terms"))
            const body = await response.json()

            expect(response.status).toBe(502)
            expect(body.error).toBe("Failed to fetch schema as JSON-LD or Turtle")
            expect(body.attempts).toEqual([
                { accept: "application/ld+json", status: 404, error: "Not Found" },
                { accept: "text/turtle", error: "Network failed" }
            ])
        })

        it("rejects fetch URLs that are not in the allowlist", async () => {
            const response = await GET(schemaRequest("https://evil.example/terms.ttl"))
            const body = await response.json()

            expect(response.status).toBe(403)
            expect(body.error).toContain("not allowed on this deployment")
        })

        it("rejects URLs not covered by the default allowlist when unset", async () => {
            setAllowedSchemaUrls(undefined)

            const response = await GET(schemaRequest("https://schema.example/terms"))
            const body = await response.json()

            expect(response.status).toBe(403)
            expect(body.error).toContain("not allowed on this deployment")
        })

        it("allows URLs covered by the default allowlist when unset", async () => {
            setAllowedSchemaUrls(undefined)
            const fetchMock = mockFetch(
                new Response('{"@context":{},"@graph":[]}', {
                    status: 200,
                    headers: { "Content-Type": "application/ld+json" }
                })
            )

            const response = await GET(
                schemaRequest("https://schema.org/version/latest/schemaorg-current-https.jsonld")
            )
            const body = await response.json()

            expect(response.status).toBe(200)
            expect(body.format).toBe("jsonld")
            expect(fetchMock).toHaveBeenCalledTimes(1)
        })
    })

    describe("bundled schemas", () => {
        it("serves a bundled schema file for relative schema/ paths", async () => {
            const response = await GET(schemaRequest("schema/codemeta-3.0-terms.jsonld"))
            const body = await response.json()

            expect(response.status).toBe(200)
            expect(body.format).toBe("jsonld")
            expect(JSON.parse(body.content)["@graph"]).toBeDefined()
            expect(response.headers.get("Cache-Control")).toBe(SCHEMA_FETCH_CACHE_CONTROL)
        })

        it("serves bundled schemas even when the remote allowlist is empty", async () => {
            setAllowedSchemaUrls(undefined)

            const response = await GET(schemaRequest("schema/pcdm-selected.jsonld"))

            expect(response.status).toBe(200)
        })

        it("handles a BASE_PATH prefixed bundled schema path", async () => {
            setAllowedSchemaUrls(undefined)
            const originalBasePath = process.env.BASE_PATH
            process.env.BASE_PATH = "/novacrate"

            try {
                const response = await GET(schemaRequest("/novacrate/schema/codemeta-3.0-terms.jsonld"))
                expect(response.status).toBe(200)
            } finally {
                if (originalBasePath === undefined) delete process.env.BASE_PATH
                else process.env.BASE_PATH = originalBasePath
            }
        })

        it("rejects paths that escape the bundled schema directory", async () => {
            const response = await GET(schemaRequest("schema/../../package.json"))

            expect(response.status).toBe(400)
        })

        it("rejects unknown bundled schema paths", async () => {
            const response = await GET(schemaRequest("schema/does-not-exist.jsonld"))

            expect(response.status).toBe(400)
        })
    })

})
