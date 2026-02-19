import { CrateContext } from "@/lib/crate-context"
import { spyOn } from "jest-mock"

const exampleWithVocab = {
    "@vocab": "https://w3id.org/ro/crate/1.2/context"
}

const exampleWithVocabAndCustom = {
    "@vocab": "https://w3id.org/ro/crate/1.2/context",
    tldr: "https://example.org/tldr/"
}

describe("crate-context", () => {
    it("is initially empty", () => {
        const context = new CrateContext()
        expect(Object.keys(context.context).length).toBe(0)
        expect(Object.keys(context.customPairs).length).toBe(0)
        expect(context.specification).toBe(undefined)
        expect(context.usingFallback).toBe(false)
    })

    it("isSameAs works", async () => {
        const context1 = new CrateContext()
        expect(context1.isSameAs({})).toBe(false)

        await context1.setup({})
        expect(context1.isSameAs({})).toBe(true)

        await context1.setup("https://w3id.org/ro/crate/1.2/context")
        expect(context1.isSameAs("https://w3id.org/ro/crate/1.2/context")).toBe(true)

        await context1.setup(exampleWithVocabAndCustom)
        expect(context1.isSameAs(exampleWithVocab)).toBe(false)
        expect(context1.isSameAs(exampleWithVocabAndCustom)).toBe(true)
    })

    it("should work for spec v1.1", async () => {
        const context = new CrateContext()
        await context.setup("https://w3id.org/ro/crate/1.1/context")
        expect(context.specification).toBe("v1.1.3")
        expect(context.usingFallback).toBe(false)
        expect(context.resolve("Organization")).toBe("https://schema.org/Organization")
        expect(context.resolve("hasPart")).toBe("https://schema.org/hasPart")
        expect(context.resolve("issueTracker")).toBe(null)

        expect(context.reverse("https://schema.org/Organization")).toBe("Organization")
        expect(context.reverse("https://schema.org/hasPart")).toBe("hasPart")
    })

    it("should work for spec v1.2", async () => {
        const context = new CrateContext()
        await context.setup("https://w3id.org/ro/crate/1.2/context")
        expect(context.specification).toBe("v1.2.0")
        expect(context.usingFallback).toBe(false)
        expect(context.resolve("Organization")).toBe("https://schema.org/Organization")
        expect(context.resolve("hasPart")).toBe("https://schema.org/hasPart")
        expect(context.resolve("issueTracker")).toBe(
            "https://codemeta.github.io/terms/issueTracker"
        )

        expect(context.reverse("https://schema.org/Organization")).toBe("Organization")
        expect(context.reverse("https://schema.org/hasPart")).toBe("hasPart")
        expect(context.reverse("https://codemeta.github.io/terms/issueTracker")).toBe(
            "issueTracker"
        )
    })

    it("should resolve custom schemas", async () => {
        const context = new CrateContext()
        await context.setup({
            "@vocab": "https://w3id.org/ro/crate/1.2/context",
            custom: "https://example.org/schema/v1/"
        })

        // from v1.2 specification test
        expect(context.specification).toBe("v1.2.0")
        expect(context.usingFallback).toBe(false)
        expect(context.resolve("Organization")).toBe("https://schema.org/Organization")
        expect(context.resolve("hasPart")).toBe("https://schema.org/hasPart")
        expect(context.resolve("issueTracker")).toBe(
            "https://codemeta.github.io/terms/issueTracker"
        )

        // custom schema test
        expect(context.resolve("custom:someTest")).toBe("https://example.org/schema/v1/someTest")
        expect(context.reverse("https://example.org/schema/v1/someTest")).toBe("custom:someTest")
    })

    it("should fallback when the provided context is unknown", async () => {
        const context = new CrateContext()
        expect(context.usingFallback).toBe(false)
        const mock = spyOn(global.console, "warn").mockImplementationOnce(() => {})
        await context.setup("https://example.org/unknown-context")
        expect(context.usingFallback).toBe(true)
        expect(context.specification).toBe("v1.1.3")
        expect(mock).toHaveBeenCalled()
    })
})
