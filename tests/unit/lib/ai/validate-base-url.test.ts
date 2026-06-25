import { validateBaseUrl } from "@/lib/ai/providers/validate-base-url"

const ORIGINAL_REGEX = process.env.AI_ASSISTANT_BASE_URL_REGEX

function setAllowedBaseUrlRegex(regex: string | undefined) {
    if (regex === undefined) {
        delete process.env.AI_ASSISTANT_BASE_URL_REGEX
    } else {
        process.env.AI_ASSISTANT_BASE_URL_REGEX = regex
    }
}

describe("validateBaseUrl", () => {
    beforeEach(() => {
        setAllowedBaseUrlRegex(undefined)
    })

    afterAll(() => {
        setAllowedBaseUrlRegex(ORIGINAL_REGEX)
    })

    describe("no-op for empty values", () => {
        it("should accept undefined even when no regex is configured", () => {
            expect(() => validateBaseUrl(undefined)).not.toThrow()
        })

        it("should accept an empty string even when no regex is configured", () => {
            expect(() => validateBaseUrl("")).not.toThrow()
        })
    })

    describe("regex configuration", () => {
        it("should reject custom base URLs when no regex is configured", () => {
            expect(() => validateBaseUrl("https://api.openai.com/v1")).toThrow(
                "Custom base URLs are not allowed on this deployment"
            )
        })

        it("should accept a URL when its hostname matches the configured regex", () => {
            setAllowedBaseUrlRegex("^api\\.openai\\.com$")
            expect(() => validateBaseUrl("https://api.openai.com/v1")).not.toThrow()
        })

        it("should reject a URL when its hostname does not match the configured regex", () => {
            setAllowedBaseUrlRegex("^api\\.openai\\.com$")
            expect(() => validateBaseUrl("https://api.anthropic.com/v1")).toThrow(
                "Not permitted on this deployment"
            )
        })

        it("should apply the regex case-insensitively", () => {
            setAllowedBaseUrlRegex("^api\\.openai\\.com$")
            expect(() => validateBaseUrl("https://API.OPENAI.COM/v1")).not.toThrow()
        })

        it("should apply the regex to the hostname, not the full URL", () => {
            setAllowedBaseUrlRegex("^api\\.openai\\.com$")
            expect(() => validateBaseUrl("https://api.openai.com/v1/models")).not.toThrow()
        })
    })

    describe("valid URLs", () => {
        beforeEach(() => {
            setAllowedBaseUrlRegex(
                "^(api\\.openai\\.com|api\\.anthropic\\.com|openrouter\\.ai|" +
                    "my-custom-provider\\.example\\.com|ki-toolbox\\.scc\\.kit\\.edu)$"
            )
        })

        it("should accept https://api.openai.com/v1", () => {
            expect(() => validateBaseUrl("https://api.openai.com/v1")).not.toThrow()
        })

        it("should accept https://api.anthropic.com/v1", () => {
            expect(() => validateBaseUrl("https://api.anthropic.com/v1")).not.toThrow()
        })

        it("should accept https://openrouter.ai/api/v1", () => {
            expect(() => validateBaseUrl("https://openrouter.ai/api/v1")).not.toThrow()
        })

        it("should accept https://my-custom-provider.example.com", () => {
            expect(() =>
                validateBaseUrl("https://my-custom-provider.example.com")
            ).not.toThrow()
        })

        it("should accept an explicitly allowed KIT host", () => {
            expect(() =>
                validateBaseUrl("https://ki-toolbox.scc.kit.edu/api/v1")
            ).not.toThrow()
        })
    })

    describe("invalid URL format", () => {
        it("should reject a completely invalid URL before checking the regex", () => {
            expect(() => validateBaseUrl("not-a-url")).toThrow("not a valid URL")
        })
    })

    describe("protocol checks", () => {
        beforeEach(() => {
            setAllowedBaseUrlRegex("^api\\.openai\\.com$")
        })

        it("should reject http:// before checking the regex", () => {
            expect(() => validateBaseUrl("http://api.openai.com/v1")).toThrow(
                "protocol must be https"
            )
        })

        it("should reject ftp:// before checking the regex", () => {
            expect(() => validateBaseUrl("ftp://api.openai.com")).toThrow(
                "protocol must be https"
            )
        })
    })

    describe("IP address checks", () => {
        beforeEach(() => {
            setAllowedBaseUrlRegex(".*")
        })

        it("should reject IPv4 localhost 127.0.0.1", () => {
            expect(() => validateBaseUrl("https://127.0.0.1")).toThrow(
                "IP addresses are not allowed"
            )
        })

        it("should reject IPv4 private 192.168.1.1", () => {
            expect(() => validateBaseUrl("https://192.168.1.1")).toThrow(
                "IP addresses are not allowed"
            )
        })

        it("should reject IPv4 private 10.0.0.1", () => {
            expect(() => validateBaseUrl("https://10.0.0.1/v1")).toThrow(
                "IP addresses are not allowed"
            )
        })

        it("should reject IPv4 link-local 169.254.169.254", () => {
            expect(() => validateBaseUrl("https://169.254.169.254")).toThrow(
                "IP addresses are not allowed"
            )
        })

        it("should reject IPv4 with port", () => {
            expect(() => validateBaseUrl("https://192.168.1.1:8080/v1")).toThrow(
                "IP addresses are not allowed"
            )
        })

        it("should reject IPv6 loopback [::1]", () => {
            expect(() => validateBaseUrl("https://[::1]")).toThrow(
                "IP addresses are not allowed"
            )
        })

        it("should reject IPv6 address [fe80::1]", () => {
            expect(() => validateBaseUrl("https://[fe80::1]")).toThrow(
                "IP addresses are not allowed"
            )
        })

        it("should reject full IPv6 address", () => {
            expect(() =>
                validateBaseUrl("https://[2001:0db8:85a3:0000:0000:8a2e:0370:7334]")
            ).toThrow("IP addresses are not allowed")
        })

        it("should reject IPv6 with port", () => {
            expect(() => validateBaseUrl("https://[::1]:8080/v1")).toThrow(
                "IP addresses are not allowed"
            )
        })
    })

    describe("deployment regex restrictions", () => {
        beforeEach(() => {
            setAllowedBaseUrlRegex("^ki-toolbox\\.scc\\.kit\\.edu$")
        })

        it("should reject kit.edu itself when it is not allowed by the regex", () => {
            expect(() => validateBaseUrl("https://kit.edu")).toThrow(
                "Not permitted on this deployment"
            )
        })

        it("should reject a subdomain of kit.edu when it is not allowed by the regex", () => {
            expect(() => validateBaseUrl("https://internal.kit.edu/api")).toThrow(
                "Not permitted on this deployment"
            )
        })

        it("should reject deeply nested kit.edu subdomains when they are not allowed", () => {
            expect(() =>
                validateBaseUrl("https://some.deep.subdomain.kit.edu/api")
            ).toThrow("Not permitted on this deployment")
        })

        it("should reject scc.kit.edu when it is not allowed by the regex", () => {
            expect(() => validateBaseUrl("https://scc.kit.edu")).toThrow(
                "Not permitted on this deployment"
            )
        })

        it("should reject other-service.scc.kit.edu when it is not allowed", () => {
            expect(() => validateBaseUrl("https://other-service.scc.kit.edu/v1")).toThrow(
                "Not permitted on this deployment"
            )
        })

        it("should reject kit.edu with mixed casing when it is not allowed", () => {
            expect(() => validateBaseUrl("https://Internal.KIT.EDU/api")).toThrow(
                "Not permitted on this deployment"
            )
        })

        it("should allow ki-toolbox.scc.kit.edu", () => {
            expect(() => validateBaseUrl("https://ki-toolbox.scc.kit.edu")).not.toThrow()
        })

        it("should allow ki-toolbox.scc.kit.edu with a path", () => {
            expect(() =>
                validateBaseUrl("https://ki-toolbox.scc.kit.edu/api/v1")
            ).not.toThrow()
        })

        it("should reject domains that merely contain kit.edu when not allowed by the regex", () => {
            expect(() => validateBaseUrl("https://toolkit.education")).toThrow(
                "Not permitted on this deployment"
            )
        })
    })
})
