import {
    assertSchemaFetchUrlAllowed,
    getSchemaFetchAllowedGlobs,
    globToRegExp,
    isSchemaFetchUrlAllowed
} from "@/lib/schema-fetch-whitelist"

const ORIGINAL_ALLOWED_URLS = process.env.SCHEMA_FETCH_ALLOWED_URLS

function setAllowedSchemaUrls(globs: string | undefined) {
    if (globs === undefined) {
        delete process.env.SCHEMA_FETCH_ALLOWED_URLS
    } else {
        process.env.SCHEMA_FETCH_ALLOWED_URLS = globs
    }
}

describe("globToRegExp", () => {
    it("matches the full URL exactly", () => {
        const regex = globToRegExp("https://schema.org/Person")
        expect(regex.test("https://schema.org/Person")).toBe(true)
        expect(regex.test("https://schema.org/Person/child")).toBe(false)
        expect(regex.test("https://other.example/Person")).toBe(false)
    })

    it("caps * to a single path segment", () => {
        const regex = globToRegExp("https://schema.org/*")
        expect(regex.test("https://schema.org/Person")).toBe(true)
        expect(regex.test("https://schema.org/a/b")).toBe(false)
    })

    it("lets ** span multiple path segments", () => {
        const regex = globToRegExp("https://schema.org/**")
        expect(regex.test("https://schema.org/Person")).toBe(true)
        expect(regex.test("https://schema.org/a/b/c.jsonld")).toBe(true)
    })

    it("lets ? match a single character", () => {
        const regex = globToRegExp("https://schema.org/?erson")
        expect(regex.test("https://schema.org/Person")).toBe(true)
        expect(regex.test("https://schema.org/Persona")).toBe(false)
    })

    it("escapes regex special characters", () => {
        const regex = globToRegExp("https://schema.org/terms.ttl")
        expect(regex.test("https://schema.org/terms.ttl")).toBe(true)
        expect(regex.test("https://schema.org/termsXttl")).toBe(false)
    })

    it("matches case-insensitively", () => {
        const regex = globToRegExp("https://schema.org/**")
        expect(regex.test("HTTPS://SCHEMA.ORG/Person")).toBe(true)
    })
})

describe("getSchemaFetchAllowedGlobs", () => {
    beforeEach(() => {
        setAllowedSchemaUrls(undefined)
    })

    afterAll(() => {
        setAllowedSchemaUrls(ORIGINAL_ALLOWED_URLS)
    })

    it("returns the secure default allowlist when not configured", () => {
        const globs = getSchemaFetchAllowedGlobs()
        expect(globs).toContain("https://schema.org/**")
        expect(globs).toContain("https://bioschemas.org/**")
        expect(globs).toContain("https://www.dublincore.org/**")
        expect(globs).toContain("http://pcdm.org/models#**")
    })

    it("splits and trims whitespace- and comma-separated patterns", () => {
        setAllowedSchemaUrls("  https://schema.org/** , https://example.com/**\t ")
        expect(getSchemaFetchAllowedGlobs()).toEqual([
            "https://schema.org/**",
            "https://example.com/**"
        ])
    })
})

describe("isSchemaFetchUrlAllowed", () => {
    beforeEach(() => {
        setAllowedSchemaUrls("https://schema.org/** https://www.example.org/terms/**")
    })

    afterAll(() => {
        setAllowedSchemaUrls(ORIGINAL_ALLOWED_URLS)
    })

    it("allows URLs matching any glob", () => {
        expect(isSchemaFetchUrlAllowed(new URL("https://schema.org/Person"))).toBe(true)
        expect(isSchemaFetchUrlAllowed(new URL("https://www.example.org/terms/onto.jsonld"))).toBe(
            true
        )
    })

    it("rejects URLs that match no glob", () => {
        expect(isSchemaFetchUrlAllowed(new URL("https://evil.example/x"))).toBe(false)
        expect(isSchemaFetchUrlAllowed(new URL("https://www.example.org/other/x"))).toBe(false)
    })
})

describe("assertSchemaFetchUrlAllowed", () => {
    beforeEach(() => {
        setAllowedSchemaUrls(undefined)
    })

    afterAll(() => {
        setAllowedSchemaUrls(ORIGINAL_ALLOWED_URLS)
    })

    it("accepts URLs covered by the default allowlist when not configured", () => {
        expect(() =>
            assertSchemaFetchUrlAllowed(new URL("https://schema.org/Person"))
        ).not.toThrow()
    })

    it("rejects URLs that are not in the default allowlist when not configured", () => {
        expect(() => assertSchemaFetchUrlAllowed(new URL("https://evil.example/x"))).toThrow(
            "not allowed on this deployment"
        )
    })

    it("lets the environment allowlist replace the default", () => {
        setAllowedSchemaUrls("https://schema.example/**")
        expect(() =>
            assertSchemaFetchUrlAllowed(new URL("https://schema.example/terms"))
        ).not.toThrow()
        expect(() => assertSchemaFetchUrlAllowed(new URL("https://schema.org/Person"))).toThrow(
            "not allowed on this deployment"
        )
    })

    it("throws when the allowlist rejects a URL", () => {
        setAllowedSchemaUrls("https://schema.org/**")
        expect(() => assertSchemaFetchUrlAllowed(new URL("https://evil.example/x"))).toThrow(
            "https://evil.example/x"
        )
    })
})
