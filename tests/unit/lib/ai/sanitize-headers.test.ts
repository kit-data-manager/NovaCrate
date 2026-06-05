import { sanitizeHeaders } from "@/lib/ai/providers/sanitize-headers"

describe("sanitizeHeaders", () => {
    it("should return an empty object for undefined input", () => {
        expect(sanitizeHeaders(undefined)).toEqual({})
    })

    it("should return an empty object for an empty input", () => {
        expect(sanitizeHeaders({})).toEqual({})
    })

    it("should pass through safe custom headers", () => {
        const headers = {
            "X-Custom-Header": "value",
            "anthropic-version": "2023-06-01",
            Accept: "application/json"
        }
        expect(sanitizeHeaders(headers)).toEqual(headers)
    })

    describe("auth headers", () => {
        it("should strip Authorization", () => {
            expect(sanitizeHeaders({ Authorization: "Bearer stolen" })).toEqual({})
        })

        it("should strip X-Api-Key", () => {
            expect(sanitizeHeaders({ "X-Api-Key": "sk-stolen" })).toEqual({})
        })

        it("should strip Proxy-Authorization", () => {
            expect(sanitizeHeaders({ "Proxy-Authorization": "Basic creds" })).toEqual({})
        })
    })

    describe("host and routing headers", () => {
        it("should strip Host", () => {
            expect(sanitizeHeaders({ Host: "evil.com" })).toEqual({})
        })

        it("should strip Origin", () => {
            expect(sanitizeHeaders({ Origin: "https://evil.com" })).toEqual({})
        })

        it("should strip Referer", () => {
            expect(sanitizeHeaders({ Referer: "https://evil.com" })).toEqual({})
        })
    })

    describe("proxy and forwarding headers", () => {
        it("should strip X-Forwarded-For", () => {
            expect(sanitizeHeaders({ "X-Forwarded-For": "1.2.3.4" })).toEqual({})
        })

        it("should strip X-Forwarded-Host", () => {
            expect(sanitizeHeaders({ "X-Forwarded-Host": "evil.com" })).toEqual({})
        })

        it("should strip X-Forwarded-Proto", () => {
            expect(sanitizeHeaders({ "X-Forwarded-Proto": "http" })).toEqual({})
        })

        it("should strip X-Real-IP", () => {
            expect(sanitizeHeaders({ "X-Real-IP": "1.2.3.4" })).toEqual({})
        })

        it("should strip Forwarded", () => {
            expect(sanitizeHeaders({ Forwarded: "for=1.2.3.4" })).toEqual({})
        })

        it("should strip Via", () => {
            expect(sanitizeHeaders({ Via: "1.1 proxy" })).toEqual({})
        })
    })

    describe("cookie headers", () => {
        it("should strip Cookie", () => {
            expect(sanitizeHeaders({ Cookie: "session=abc" })).toEqual({})
        })

        it("should strip Set-Cookie", () => {
            expect(sanitizeHeaders({ "Set-Cookie": "session=abc" })).toEqual({})
        })
    })

    describe("case insensitivity", () => {
        it("should block headers regardless of casing", () => {
            const result = sanitizeHeaders({
                authorization: "Bearer stolen",
                AUTHORIZATION: "Bearer stolen",
                "x-api-key": "sk-stolen",
                "X-API-KEY": "sk-stolen",
                host: "evil.com",
                HOST: "evil.com",
                cookie: "session=abc",
                COOKIE: "session=abc"
            })
            expect(result).toEqual({})
        })
    })

    it("should keep safe headers while stripping blocked ones", () => {
        const result = sanitizeHeaders({
            "X-Custom": "safe",
            Authorization: "Bearer stolen",
            "Content-Type": "application/json",
            Host: "evil.com",
            "anthropic-version": "2023-06-01",
            Cookie: "session=abc"
        })
        expect(result).toEqual({
            "X-Custom": "safe",
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        })
    })

    it("should not mutate the input object", () => {
        const input = { Authorization: "Bearer stolen", "X-Custom": "safe" }
        const inputCopy = { ...input }
        sanitizeHeaders(input)
        expect(input).toEqual(inputCopy)
    })
})
