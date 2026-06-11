import { validateOrigin } from "@/lib/ai/validate-origin"

describe("validateOrigin", () => {
    const ALLOWED = "https://novacrate.example.com"

    describe("matching origins", () => {
        it("should accept an exact match", () => {
            expect(validateOrigin("https://novacrate.example.com", ALLOWED)).toBe(true)
        })

        it("should accept a match with trailing slash on origin", () => {
            expect(validateOrigin("https://novacrate.example.com/", ALLOWED)).toBe(true)
        })

        it("should accept a match with trailing slash on allowed", () => {
            expect(validateOrigin("https://novacrate.example.com", ALLOWED + "/")).toBe(true)
        })

        it("should be case-insensitive", () => {
            expect(validateOrigin("HTTPS://NOVACRATE.EXAMPLE.COM", ALLOWED)).toBe(true)
        })

        it("should handle mixed casing", () => {
            expect(
                validateOrigin("Https://NovaCrate.Example.Com", "https://novacrate.example.com")
            ).toBe(true)
        })
    })

    describe("mismatching origins", () => {
        it("should reject a different domain", () => {
            expect(validateOrigin("https://evil.com", ALLOWED)).toBe(false)
        })

        it("should reject a different protocol", () => {
            expect(validateOrigin("http://novacrate.example.com", ALLOWED)).toBe(false)
        })

        it("should reject a subdomain of the allowed origin", () => {
            expect(validateOrigin("https://sub.novacrate.example.com", ALLOWED)).toBe(false)
        })

        it("should reject a parent domain of the allowed origin", () => {
            expect(validateOrigin("https://example.com", ALLOWED)).toBe(false)
        })

        it("should reject a different port", () => {
            expect(validateOrigin("https://novacrate.example.com:8443", ALLOWED)).toBe(false)
        })
    })

    describe("missing origin", () => {
        it("should reject null (missing Origin header)", () => {
            expect(validateOrigin(null, ALLOWED)).toBe(false)
        })
    })

    describe("localhost origins", () => {
        it("should accept localhost with matching port", () => {
            expect(validateOrigin("http://localhost:3000", "http://localhost:3000")).toBe(true)
        })

        it("should reject localhost with different port", () => {
            expect(validateOrigin("http://localhost:3001", "http://localhost:3000")).toBe(false)
        })
    })
})
