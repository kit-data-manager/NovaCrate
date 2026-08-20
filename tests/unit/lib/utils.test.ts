import { prependBasePath } from "@/lib/utils"

const ORIGINAL_BASE_PATH = process.env.BASE_PATH

function setBasePath(basePath: string | undefined) {
    if (basePath === undefined) {
        delete process.env.BASE_PATH
    } else {
        process.env.BASE_PATH = basePath
    }
}

afterAll(() => {
    setBasePath(ORIGINAL_BASE_PATH)
})

describe("prependBasePath", () => {
    beforeEach(() => {
        setBasePath(undefined)
    })

    it("returns the path unchanged when BASE_PATH is undefined", () => {
        expect(prependBasePath("schema/codemeta-3.0-terms.jsonld")).toBe(
            "schema/codemeta-3.0-terms.jsonld"
        )
        expect(prependBasePath("/api/schemas/fetch?url=x")).toBe("/api/schemas/fetch?url=x")
    })

    it("returns the path unchanged when BASE_PATH is empty", () => {
        setBasePath("")
        expect(prependBasePath("/api/schemas/fetch?url=x")).toBe("/api/schemas/fetch?url=x")
    })

    it("prepends BASE_PATH to an absolute path", () => {
        setBasePath("/novacrate")
        expect(prependBasePath("/api/schemas/fetch?url=x")).toBe(
            "/novacrate/api/schemas/fetch?url=x"
        )
    })

    it("prepends BASE_PATH to a relative path with a separator", () => {
        setBasePath("/novacrate")
        expect(prependBasePath("schema/codemeta-3.0-terms.jsonld")).toBe(
            "/novacrate/schema/codemeta-3.0-terms.jsonld"
        )
    })

    it("does not double-prefix a path that already has the base path", () => {
        setBasePath("/novacrate")
        expect(prependBasePath("/novacrate/api/schemas/fetch?url=x")).toBe(
            "/novacrate/api/schemas/fetch?url=x"
        )
    })

    it("handles a trailing slash on BASE_PATH", () => {
        setBasePath("/novacrate/")
        expect(prependBasePath("/api/schemas/fetch?url=x")).toBe(
            "/novacrate/api/schemas/fetch?url=x"
        )
    })
})
