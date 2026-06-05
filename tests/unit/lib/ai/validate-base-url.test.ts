import { validateBaseUrl } from "@/lib/ai/providers/validate-base-url"

describe("validateBaseUrl", () => {
    describe("no-op for empty values", () => {
        it("should accept undefined", () => {
            expect(() => validateBaseUrl(undefined)).not.toThrow()
        })

        it("should accept an empty string", () => {
            expect(() => validateBaseUrl("")).not.toThrow()
        })
    })

    describe("valid URLs", () => {
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

        it("should accept the allowed KIT host ki-toolbox.scc.kit.edu", () => {
            expect(() =>
                validateBaseUrl("https://ki-toolbox.scc.kit.edu/api/v1")
            ).not.toThrow()
        })
    })

    describe("invalid URL format", () => {
        it("should reject a completely invalid URL", () => {
            expect(() => validateBaseUrl("not-a-url")).toThrow("not a valid URL")
        })
    })

    describe("protocol checks", () => {
        it("should reject http://", () => {
            expect(() => validateBaseUrl("http://api.openai.com/v1")).toThrow(
                "protocol must be https"
            )
        })

        it("should reject ftp://", () => {
            expect(() => validateBaseUrl("ftp://files.example.com")).toThrow(
                "protocol must be https"
            )
        })
    })

    describe("IP address checks", () => {
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

    describe("kit.edu domain restrictions", () => {
        it("should reject kit.edu itself", () => {
            expect(() => validateBaseUrl("https://kit.edu")).toThrow(
                "connections to kit.edu resources are not allowed"
            )
        })

        it("should reject a subdomain of kit.edu", () => {
            expect(() => validateBaseUrl("https://internal.kit.edu/api")).toThrow(
                "connections to kit.edu resources are not allowed"
            )
        })

        it("should reject deeply nested kit.edu subdomains", () => {
            expect(() =>
                validateBaseUrl("https://some.deep.subdomain.kit.edu/api")
            ).toThrow("connections to kit.edu resources are not allowed")
        })

        it("should reject scc.kit.edu (sibling of allowed host)", () => {
            expect(() => validateBaseUrl("https://scc.kit.edu")).toThrow(
                "connections to kit.edu resources are not allowed"
            )
        })

        it("should reject other-service.scc.kit.edu", () => {
            expect(() =>
                validateBaseUrl("https://other-service.scc.kit.edu/v1")
            ).toThrow("connections to kit.edu resources are not allowed")
        })

        it("should reject kit.edu with mixed casing", () => {
            expect(() => validateBaseUrl("https://Internal.KIT.EDU/api")).toThrow(
                "connections to kit.edu resources are not allowed"
            )
        })

        it("should allow ki-toolbox.scc.kit.edu", () => {
            expect(() =>
                validateBaseUrl("https://ki-toolbox.scc.kit.edu")
            ).not.toThrow()
        })

        it("should allow ki-toolbox.scc.kit.edu with a path", () => {
            expect(() =>
                validateBaseUrl("https://ki-toolbox.scc.kit.edu/api/v1")
            ).not.toThrow()
        })

        it("should not block domains that merely contain 'kit.edu' as a substring", () => {
            expect(() => validateBaseUrl("https://toolkit.education")).not.toThrow()
        })
    })
})
