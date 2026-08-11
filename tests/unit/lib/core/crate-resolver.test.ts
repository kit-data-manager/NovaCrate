import { CrateResolver, parseLinkHeader } from "@/lib/core/profiles/impl/CrateResolver"
import { InMemoryReadOnlyFileService } from "@/lib/core/profiles/impl/InMemoryReadOnlyFileService"
import { ProfileHandlerError } from "@/lib/core/profiles/impl/ProfileHandlerError"
import JSZip from "jszip"

function validCrate(name = "Test"): ICrate {
    return {
        "@context": "https://w3id.org/ro/crate/1.2/context",
        "@graph": [
            { "@id": "./", "@type": "Dataset", name },
            {
                "@id": "ro-crate-metadata.json",
                "@type": "CreativeWork",
                about: { "@id": "./" },
                conformsTo: { "@id": "https://w3id.org/ro/crate/1.2" }
            }
        ]
    }
}

function mockResponse(
    body: BodyInit | null,
    init: { status?: number; headers?: Record<string, string> } = {}
): Response {
    const headers = new Headers(init.headers)
    return new Response(body, {
        status: init.status ?? 200,
        headers
    })
}

function makeJsonResponse(crate: ICrate): Response {
    return mockResponse(JSON.stringify(crate), {
        headers: { "Content-Type": "application/ld+json" }
    })
}

async function makeZipResponseAsync(
    crate: ICrate,
    extraFiles: Record<string, string> = {}
): Promise<Response> {
    const zip = new JSZip()
    zip.file("ro-crate-metadata.json", JSON.stringify(crate))
    for (const [path, content] of Object.entries(extraFiles)) {
        zip.file(path, content)
    }
    const buffer = await zip.generateAsync({ type: "arraybuffer" })
    return mockResponse(buffer, {
        headers: { "Content-Type": "application/zip" }
    })
}

async function makeElnZipResponse(crate: ICrate, folder = "my-crate"): Promise<Response> {
    const zip = new JSZip()
    zip.file(`${folder}/ro-crate-metadata.json`, JSON.stringify(crate))
    zip.file(`${folder}/data.txt`, "hello")
    const buffer = await zip.generateAsync({ type: "arraybuffer" })
    return mockResponse(buffer, {
        headers: { "Content-Type": "application/zip" }
    })
}

function createResolver(responses: Response[] | ((url: string) => Response)) {
    const mock = jest.fn(
        Array.isArray(responses) ? ((_: string) => responses.shift()!) : responses
    )
    jest.spyOn(globalThis, "fetch").mockImplementation(mock as unknown as typeof fetch)
    const resolver = new CrateResolver()
    return { resolver, fetchMock: mock }
}

afterEach(() => {
    jest.restoreAllMocks()
})

describe("parseLinkHeader", () => {
    it("parses a single link with rel and profile", () => {
        const header =
            '<https://example.com/crate.zip>; rel="item"; type="application/zip"; profile="https://w3id.org/ro/crate"'
        const links = parseLinkHeader(header)
        expect(links).toHaveLength(1)
        expect(links[0].uri).toBe("https://example.com/crate.zip")
        expect(links[0].rels).toEqual(["item"])
        expect(links[0].params.profile).toBe("https://w3id.org/ro/crate")
        expect(links[0].params.type).toBe("application/zip")
    })

    it("parses multiple comma-separated links", () => {
        const header =
            '<https://example.com/meta.json>; rel="describedby", <https://example.com/crate.zip>; rel="item"; profile="https://w3id.org/ro/crate"'
        const links = parseLinkHeader(header)
        expect(links).toHaveLength(2)
        expect(links[0].rels).toEqual(["describedby"])
        expect(links[1].params.profile).toBe("https://w3id.org/ro/crate")
    })

    it("parses unquoted parameter values", () => {
        const header = "<https://example.com/crate.zip>; rel=item; profile=https://w3id.org/ro/crate"
        const links = parseLinkHeader(header)
        expect(links[0].rels).toEqual(["item"])
        expect(links[0].params.profile).toBe("https://w3id.org/ro/crate")
    })

    it("parses multiple rel values", () => {
        const header = "<https://example.com/crate.zip>; rel=\"item describedby\""
        const links = parseLinkHeader(header)
        expect(links[0].rels).toEqual(["item", "describedby"])
    })

    it("returns empty for empty header", () => {
        expect(parseLinkHeader("")).toEqual([])
        expect(parseLinkHeader("   ")).toEqual([])
    })
})

describe("InMemoryReadOnlyFileService", () => {
    it("returns files and infers parent directories", async () => {
        const service = new InMemoryReadOnlyFileService([
            { path: "data/file.txt", content: new Blob(["hello"]) }
        ])
        const list = await service.getContentList()
        const paths = list.map((i) => i.path)
        expect(paths).toContain("data")
        expect(paths).toContain("data/file.txt")
        expect(list.find((i) => i.path === "data")?.type).toBe("directory")
        expect(list.find((i) => i.path === "data/file.txt")?.type).toBe("file")
    })

    it("getFile returns blob for existing path", async () => {
        const service = new InMemoryReadOnlyFileService([
            { path: "file.txt", content: new Blob(["content"]) }
        ])
        const blob = await service.getFile("file.txt")
        expect(await blob.text()).toBe("content")
    })

    it("getFile throws for missing path", async () => {
        const service = new InMemoryReadOnlyFileService([])
        await expect(service.getFile("missing.txt")).rejects.toThrow()
    })

    it("getInfo throws for missing path", async () => {
        const service = new InMemoryReadOnlyFileService([])
        await expect(service.getInfo("missing")).rejects.toThrow()
    })
})

describe("CrateResolver", () => {
    describe("signposting", () => {
        it("follows rel=item link with RO-Crate profile to a zip archive", async () => {
            const crate = validCrate("From Signposting")
            const zipResponse = await makeZipResponseAsync(crate, { "data.txt": "hello" })
            const htmlResponse = mockResponse("<html></html>", {
                headers: {
                    "Content-Type": "text/html",
                    Link: '<https://example.com/crate.zip>; rel="item"; type="application/zip"; profile="https://w3id.org/ro/crate"'
                }
            })
            const { resolver, fetchMock } = createResolver([htmlResponse, zipResponse])

            const result = await resolver.resolveCrate("https://doi.org/10.1234/test")

            expect(fetchMock).toHaveBeenCalledTimes(2)
            expect(fetchMock).toHaveBeenNthCalledWith(1, "https://doi.org/10.1234/test", expect.any(Object))
            expect(fetchMock).toHaveBeenNthCalledWith(2, "https://example.com/crate.zip", expect.any(Object))
            expect(result.metadata["@graph"][0].name).toBe("From Signposting")
            const file = await result.fileService.getFile("data.txt")
            expect(await file.text()).toBe("hello")
        })

        it("follows rel=describedby link to a metadata document", async () => {
            const crate = validCrate("DescribedBy")
            const htmlResponse = mockResponse("<html></html>", {
                headers: {
                    "Content-Type": "text/html",
                    Link: '<https://example.com/ro-crate-metadata.json>; rel="describedby"; type="application/ld+json"; profile="https://w3id.org/ro/crate"'
                }
            })
            const { resolver } = createResolver([htmlResponse, makeJsonResponse(crate)])

            const result = await resolver.resolveCrate("https://doi.org/10.1234/test")

            expect(result.metadata["@graph"][0].name).toBe("DescribedBy")
        })

        it("prefers link with RO-Crate profile over one without", async () => {
            const crate = validCrate("Preferred")
            const htmlResponse = mockResponse("<html></html>", {
                headers: {
                    "Content-Type": "text/html",
                    Link: '<https://example.com/other.json>; rel="describedby", <https://example.com/crate.json>; rel="describedby"; profile="https://w3id.org/ro/crate"'
                }
            })
            const { resolver, fetchMock } = createResolver([htmlResponse, makeJsonResponse(crate)])

            await resolver.resolveCrate("https://doi.org/10.1234/test")

            expect(fetchMock).toHaveBeenNthCalledWith(2, "https://example.com/crate.json", expect.any(Object))
        })

        it("interprets response body directly when no link header is present", async () => {
            const crate = validCrate("Direct Body")
            const { resolver } = createResolver([makeJsonResponse(crate)])

            const result = await resolver.resolveCrate("https://example.com/crate.json")

            expect(result.metadata["@graph"][0].name).toBe("Direct Body")
        })
    })

    describe("content negotiation", () => {
        it("resolves a metadata document with RO-Crate profile content-type", async () => {
            const crate = validCrate("Negotiated")
            // Signposting returns 404, content negotiation returns the crate
            const notFound = mockResponse(null, { status: 404 })
            const negotiated = mockResponse(JSON.stringify(crate), {
                headers: {
                    "Content-Type": 'application/ld+json;profile="https://w3id.org/ro/crate"'
                }
            })

            const { resolver, fetchMock } = createResolver([notFound, negotiated])

            const result = await resolver.resolveCrate("https://example.com/profile")

            expect(fetchMock).toHaveBeenCalledTimes(2)
            expect(fetchMock).toHaveBeenNthCalledWith(
                2,
                "https://example.com/profile",
                expect.objectContaining({
                    headers: { Accept: expect.stringContaining("ro/crate") }
                })
            )
            expect(result.metadata["@graph"][0].name).toBe("Negotiated")
        })

        it("rejects non-RO-Crate JSON-LD from PID providers (no profile declared)", async () => {
            // DataCite-style response: JSON-LD without RO-Crate profile
            const fakeJsonLd = {
                "@context": "https://schema.org",
                "@graph": [{ "@id": "x", "@type": "Thing" }]
            }
            const makeFakeResponse = () =>
                mockResponse(JSON.stringify(fakeJsonLd), {
                    headers: { "Content-Type": "application/ld+json" }
                })
            // Fallback also fails
            const notFound = mockResponse(null, { status: 404 })

            const { resolver } = createResolver([
                makeFakeResponse(), // signposting (lenient -> undefined, no root entity)
                makeFakeResponse(), // content negotiation (lenient -> undefined, no crate profile)
                notFound // heuristic
            ])

            await expect(resolver.resolveCrate("https://doi.org/10.1234")).rejects.toThrow(
                ProfileHandlerError
            )
        })
    })

    describe("heuristic fallback", () => {
        it("tries ./ro-crate-metadata.json when signposting and negotiation fail", async () => {
            const crate = validCrate("Heuristic")
            // Signposting: no link header, HTML body (not valid crate -> undefined in lenient)
            const htmlResponse = mockResponse("<html>not json</html>", {
                headers: { "Content-Type": "text/html" }
            })
            // Content negotiation: returns HTML (lenient parse fails)
            const htmlNegotiation = mockResponse("<html>not json</html>", {
                headers: { "Content-Type": "text/html" }
            })
            // Heuristic: the actual metadata file
            const metaResponse = makeJsonResponse(crate)

            const { resolver, fetchMock } = createResolver([
                htmlResponse,
                htmlNegotiation,
                metaResponse
            ])

            const result = await resolver.resolveCrate("https://example.com/crate/")

            expect(fetchMock).toHaveBeenLastCalledWith(
                "https://example.com/crate/ro-crate-metadata.json",
                expect.any(Object)
            )
            expect(result.metadata["@graph"][0].name).toBe("Heuristic")
        })

        it("strips trailing filename before appending ro-crate-metadata.json", async () => {
            const crate = validCrate("Heuristic2")
            const htmlResponse = mockResponse("<html></html>", {
                headers: { "Content-Type": "text/html" }
            })
            const htmlNegotiation = mockResponse("<html></html>", {
                headers: { "Content-Type": "text/html" }
            })
            const metaResponse = makeJsonResponse(crate)

            const { resolver, fetchMock } = createResolver([
                htmlResponse,
                htmlNegotiation,
                metaResponse
            ])

            await resolver.resolveCrate("https://example.com/crate/index.html")

            expect(fetchMock).toHaveBeenLastCalledWith(
                "https://example.com/crate/ro-crate-metadata.json",
                expect.any(Object)
            )
        })
    })

    describe("zip extraction", () => {
        it("extracts ro-crate-metadata.json from a plain zip", async () => {
            const crate = validCrate("Zip Crate")
            const response = await makeZipResponseAsync(crate, {
                "data/file.txt": "file content",
                "README.md": "# Readme"
            })
            const { resolver } = createResolver([response])

            const result = await resolver.resolveCrate("https://example.com/crate.zip")

            expect(result.metadata["@graph"][0].name).toBe("Zip Crate")
            expect(await (await result.fileService.getFile("data/file.txt")).text()).toBe(
                "file content"
            )
            expect(await (await result.fileService.getFile("README.md")).text()).toBe("# Readme")
        })

        it("extracts from ELN-style single-folder zip", async () => {
            const crate = validCrate("ELN Crate")
            const response = await makeElnZipResponse(crate, "my-experiment")
            const { resolver } = createResolver([response])

            const result = await resolver.resolveCrate("https://example.com/crate.zip")

            expect(result.metadata["@graph"][0].name).toBe("ELN Crate")
            // Files should be accessible without the folder prefix
            expect(await (await result.fileService.getFile("data.txt")).text()).toBe("hello")
        })

        it("throws when zip has no ro-crate-metadata.json", async () => {
            const zip = new JSZip()
            zip.file("random.txt", "no crate here")
            const buffer = await zip.generateAsync({ type: "arraybuffer" })
            const badZipResponse = mockResponse(buffer, {
                headers: { "Content-Type": "application/zip" }
            })
            // Signposting points to the bad zip via link header (non-lenient fetchTarget)
            const htmlResponse = mockResponse("<html></html>", {
                headers: {
                    "Content-Type": "text/html",
                    Link: '<https://example.com/bad.zip>; rel="item"; type="application/zip"; profile="https://w3id.org/ro/crate"'
                }
            })
            const { resolver } = createResolver([htmlResponse, badZipResponse])

            await expect(resolver.resolveCrate("https://example.com/landing")).rejects.toThrow(
                /does not contain/
            )
        })
    })

    describe("error handling", () => {
        it("throws ProfileHandlerError when all resolution methods fail", async () => {
            const notFound1 = mockResponse(null, { status: 404 })
            const notFound2 = mockResponse(null, { status: 404 })
            const notFound3 = mockResponse(null, { status: 404 })

            const { resolver } = createResolver([notFound1, notFound2, notFound3])

            await expect(resolver.resolveCrate("https://example.com/missing")).rejects.toThrow(
                ProfileHandlerError
            )
        })

        it("throws ProfileHandlerError when fetched document is not valid JSON", async () => {
            // Signposting and content negotiation fail, heuristic returns non-JSON
            const notFound1 = mockResponse(null, { status: 404 })
            const notFound2 = mockResponse(null, { status: 404 })
            const badResponse = mockResponse("not json at all", {
                headers: { "Content-Type": "text/plain" }
            })
            const { resolver } = createResolver([notFound1, notFound2, badResponse])

            await expect(resolver.resolveCrate("https://example.com/bad")).rejects.toThrow(
                /not valid JSON/
            )
        })

        it("throws ProfileHandlerError when document has no root data entity", async () => {
            const badCrate: ICrate = {
                "@context": "https://w3id.org/ro/crate/1.2/context",
                "@graph": [{ "@id": "thing", "@type": "Thing" }]
            }
            // Signposting: lenient -> undefined (no root entity)
            const signpostingResponse = mockResponse(JSON.stringify(badCrate), {
                headers: { "Content-Type": "application/ld+json" }
            })
            // Content negotiation: declares RO-Crate profile, non-lenient -> throws
            const negotiationResponse = mockResponse(JSON.stringify(badCrate), {
                headers: {
                    "Content-Type": 'application/ld+json;profile="https://w3id.org/ro/crate"'
                }
            })
            const { resolver } = createResolver([signpostingResponse, negotiationResponse])

            await expect(resolver.resolveCrate("https://example.com/bad")).rejects.toThrow(
                /Root Data Entity/
            )
        })

        it("propagates network errors as ProfileHandlerError", async () => {
            const { resolver } = createResolver((_: string) => {
                throw new TypeError("network error")
            })

            await expect(resolver.resolveCrate("https://example.com/fail")).rejects.toThrow(
                ProfileHandlerError
            )
        })
    })
})
