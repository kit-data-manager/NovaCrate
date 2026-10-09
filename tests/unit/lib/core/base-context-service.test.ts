import { BaseContextService } from "@/lib/core/impl/BaseContextService"
import { RO_CRATE_VERSION } from "@/lib/constants"
import { spyOn } from "jest-mock"

const V1_1_CONTEXT = "https://w3id.org/ro/crate/1.1/context"
const V1_2_CONTEXT = "https://w3id.org/ro/crate/1.2/context"
const V1_3_CONTEXT = "https://w3id.org/ro/crate/1.3/context"

describe("BaseContextService", () => {
    describe("getKnownContext (static)", () => {
        it("should return the v1.1 context entry", () => {
            const known = BaseContextService.getKnownContext(V1_1_CONTEXT)
            expect(known).toBeDefined()
            expect(known!.version).toBe(RO_CRATE_VERSION.V1_1_3)
        })

        it("should return the v1.2 context entry", () => {
            const known = BaseContextService.getKnownContext(V1_2_CONTEXT)
            expect(known).toBeDefined()
            expect(known!.version).toBe(RO_CRATE_VERSION.V1_2_0)
        })

        it("should return the v1.3 context entry", () => {
            const known = BaseContextService.getKnownContext(V1_3_CONTEXT)
            expect(known).toBeDefined()
            expect(known!.version).toBe(RO_CRATE_VERSION.V1_3_0)
        })

        it("should return undefined for an unknown context ID", () => {
            expect(
                BaseContextService.getKnownContext("https://example.org/unknown")
            ).toBeUndefined()
        })
    })

    describe("newInstance with known string contexts", () => {
        it("should detect v1.1 and resolve its terms", async () => {
            const service = await BaseContextService.newInstance(V1_1_CONTEXT)

            expect(service.specification).toBe(RO_CRATE_VERSION.V1_1_3)
            expect(service.usingFallback).toBe(false)
            expect(service.errors).toEqual([])
            expect(service.getRaw()).toBe(V1_1_CONTEXT)
            expect(Object.keys(service.customPairs)).toHaveLength(0)
            expect(service.resolve("Organization")).toBe("https://schema.org/Organization")
            expect(service.resolve("hasPart")).toBe("https://schema.org/hasPart")
            expect(service.reverse("https://schema.org/Person")).toBe("Person")
        })

        it("should detect v1.2 and resolve v1.2-specific terms", async () => {
            const service = await BaseContextService.newInstance(V1_2_CONTEXT)

            expect(service.specification).toBe(RO_CRATE_VERSION.V1_2_0)
            expect(service.usingFallback).toBe(false)
            expect(service.resolve("issueTracker")).toBe(
                "https://codemeta.github.io/terms/issueTracker"
            )
            expect(service.resolve("Organization")).toBe("https://schema.org/Organization")
        })

        it("should detect v1.3 and resolve v1.3-specific terms", async () => {
            const service = await BaseContextService.newInstance(V1_3_CONTEXT)

            expect(service.specification).toBe(RO_CRATE_VERSION.V1_3_0)
            expect(service.usingFallback).toBe(false)
            expect(service.resolve("ComputationalWorkflow")).toBe(
                "https://bioschemas.org/terms/ComputationalWorkflow"
            )
            expect(service.resolve("Organization")).toBe("https://schema.org/Organization")
        })
    })

    describe("newInstance with an object context (@vocab)", () => {
        it("should detect the specification from @vocab", async () => {
            const service = await BaseContextService.newInstance({ "@vocab": V1_2_CONTEXT })

            expect(service.specification).toBe(RO_CRATE_VERSION.V1_2_0)
            expect(service.usingFallback).toBe(false)
            expect(service.errors).toEqual([])
            expect(service.getRaw()).toEqual({ "@vocab": V1_2_CONTEXT })
        })

        it("should store custom pairs and keep them resolvable and reversible", async () => {
            const service = await BaseContextService.newInstance({
                "@vocab": V1_1_CONTEXT,
                ex: "https://example.org/v1/"
            })

            expect(service.customPairs).toEqual({ ex: "https://example.org/v1/" })
            expect(service.resolve("ex:Thing")).toBe("https://example.org/v1/Thing")
            expect(service.reverse("https://example.org/v1/Thing")).toBe("ex:Thing")
            expect(service.resolve("Organization")).toBe("https://schema.org/Organization")
        })

        it("should let custom pairs defined after @vocab override spec terms", async () => {
            const service = await BaseContextService.newInstance({
                "@vocab": V1_1_CONTEXT,
                name: "https://example.org/vocab/name"
            })

            expect(service.customPairs).toEqual({
                name: "https://example.org/vocab/name"
            })
            expect(service.resolve("name")).toBe("https://example.org/vocab/name")
        })

        // A term defined by the crate itself must not be silently dropped when
        // the @vocab specification context is expanded, regardless of key order.
        it("should let custom pairs defined before @vocab override spec terms", async () => {
            const service = await BaseContextService.newInstance({
                name: "https://example.org/vocab/name",
                "@vocab": V1_1_CONTEXT
            })

            expect(service.customPairs).toEqual({
                name: "https://example.org/vocab/name"
            })
            expect(service.resolve("name")).toBe("https://example.org/vocab/name")
        })
    })

    describe("newInstance with an array context", () => {
        it("should handle a known string entry followed by custom pairs", async () => {
            const service = await BaseContextService.newInstance([
                V1_2_CONTEXT,
                { myPrefix: "https://example.org/myschema/" }
            ])

            expect(service.specification).toBe(RO_CRATE_VERSION.V1_2_0)
            expect(service.customPairs).toEqual({
                myPrefix: "https://example.org/myschema/"
            })
            expect(service.resolve("Organization")).toBe("https://schema.org/Organization")
            expect(service.resolve("myPrefix:myType")).toBe("https://example.org/myschema/myType")
        })

        it("should handle custom pairs followed by a known string entry", async () => {
            const service = await BaseContextService.newInstance([
                { myPrefix: "https://example.org/myschema/" },
                V1_1_CONTEXT
            ])

            expect(service.specification).toBe(RO_CRATE_VERSION.V1_1_3)
            expect(service.customPairs).toEqual({
                myPrefix: "https://example.org/myschema/"
            })
            expect(service.resolve("Organization")).toBe("https://schema.org/Organization")
            expect(service.resolve("myPrefix:myType")).toBe("https://example.org/myschema/myType")
        })
    })

    describe("fallback behavior", () => {
        it("should fall back to v1.1 for an unknown string context", async () => {
            const mock = spyOn(global.console, "error").mockImplementation(() => {})
            const service = await BaseContextService.newInstance("https://example.org/unknown")

            expect(service.usingFallback).toBe(true)
            expect(service.specification).toBe(RO_CRATE_VERSION.V1_1_3)
            expect(service.errors).toHaveLength(2)
            expect(String(service.errors[0])).toContain(
                "Cannot load schema https://example.org/unknown without prefix"
            )
            expect(String(service.errors[1])).toContain("Using fallback context")
            expect(mock).toHaveBeenCalled()
            mock.mockRestore()
        })

        it("should fall back to v1.1 for an unknown @vocab", async () => {
            const mock = spyOn(global.console, "error").mockImplementation(() => {})
            const service = await BaseContextService.newInstance({
                "@vocab": "https://example.org/unknown"
            })

            expect(service.usingFallback).toBe(true)
            expect(service.specification).toBe(RO_CRATE_VERSION.V1_1_3)
            expect(mock).toHaveBeenCalled()
            mock.mockRestore()
        })

        it("should fall back for an empty object context", async () => {
            const mock = spyOn(global.console, "error").mockImplementation(() => {})
            const service = await BaseContextService.newInstance({})

            expect(service.usingFallback).toBe(true)
            expect(service.specification).toBe(RO_CRATE_VERSION.V1_1_3)
            expect(service.errors).toHaveLength(1)
            mock.mockRestore()
        })

        it("should keep custom terms that do not collide with the fallback context", async () => {
            const mock = spyOn(global.console, "error").mockImplementation(() => {})
            const service = await BaseContextService.newInstance({
                myProp: "https://example.org/ns/myProp"
            })

            expect(service.usingFallback).toBe(true)
            expect(service.resolve("myProp")).toBe("https://example.org/ns/myProp")
            mock.mockRestore()
        })

        // The crate explicitly defines the term; the editor-injected fallback
        // context must not override the crate's own definition.
        it("should let crate-defined terms override the fallback context", async () => {
            const mock = spyOn(global.console, "error").mockImplementation(() => {})
            const service = await BaseContextService.newInstance({
                input: "https://example.org/ns/input"
            })

            expect(service.usingFallback).toBe(true)
            expect(service.customPairs).toEqual({ input: "https://example.org/ns/input" })
            expect(service.resolve("input")).toBe("https://example.org/ns/input")
            mock.mockRestore()
        })
    })

    describe("resolve", () => {
        let service: BaseContextService

        beforeEach(async () => {
            service = await BaseContextService.newInstance(V1_1_CONTEXT)
        })

        it("should resolve a term defined directly in the context", () => {
            expect(service.resolve("CreativeWork")).toBe("https://schema.org/CreativeWork")
        })

        it("should respect the protocol specified in the context", () => {
            expect(service.resolve("rdfs:Class")).toBe("http://www.w3.org/2000/01/rdf-schema#Class")
        })

        it("should pass a full URL through unchanged", () => {
            expect(service.resolve("https://example.org/Foo")).toBe("https://example.org/Foo")
        })

        it("should return null for an unknown plain term", () => {
            expect(service.resolve("completelyUnknownTerm")).toBeNull()
        })

        it("should return null for the empty string", () => {
            expect(service.resolve("")).toBeNull()
        })

        it("should return null and warn for an unknown prefix", () => {
            const mock = spyOn(global.console, "warn").mockImplementation(() => {})
            expect(service.resolve("unknownPrefix:Type")).toBeNull()
            expect(mock).toHaveBeenCalled()
            mock.mockRestore()
        })

        it("should resolve a prefixed id using a custom pair", async () => {
            const custom = await BaseContextService.newInstance({
                "@vocab": V1_1_CONTEXT,
                bio: "https://bioschemas.org/"
            })
            expect(custom.resolve("bio:Gene")).toBe("https://bioschemas.org/Gene")
        })

        // "a:b:c" — everything after the first colon is the local part
        it("should keep the full suffix of a prefixed id with multiple colons", async () => {
            const custom = await BaseContextService.newInstance({
                "@vocab": V1_1_CONTEXT,
                ex: "https://example.org/v1/"
            })
            expect(custom.resolve("ex:a:b")).toBe("https://example.org/v1/a:b")
        })

        it("should pass a URL with an uppercase scheme through unchanged", () => {
            expect(service.resolve("HTTPS://example.org/Foo")).toBe("HTTPS://example.org/Foo")
        })

        it("should not warn for a URL with an uppercase scheme", () => {
            const mock = spyOn(global.console, "warn").mockImplementation(() => {})
            service.resolve("HTTPS://example.org/Foo")
            expect(mock).not.toHaveBeenCalled()
            mock.mockRestore()
        })

        it("should return null for ids that name Object prototype members", () => {
            expect(service.resolve("toString")).toBeNull()
            expect(service.resolve("constructor")).toBeNull()
            expect(service.resolve("hasOwnProperty")).toBeNull()
        })
    })

    describe("reverse", () => {
        it("should reverse a known URI to its short form", async () => {
            const service = await BaseContextService.newInstance(V1_1_CONTEXT)
            expect(service.reverse("https://schema.org/Person")).toBe("Person")
        })

        it("should reverse a URI with known prefix to its short form", async () => {
            const service = await BaseContextService.newInstance(V1_1_CONTEXT)
            expect(service.reverse("http://www.w3.org/1999/02/22-rdf-syntax-ns#Property")).toBe(
                "rdf:Property"
            )
        })

        it("should reverse a URI extending a custom pair", async () => {
            const service = await BaseContextService.newInstance({
                "@vocab": V1_1_CONTEXT,
                custom: "https://myCustomUrl.org/v1/"
            })
            expect(service.reverse("https://myCustomUrl.org/v1/myProperty")).toBe(
                "custom:myProperty"
            )
            expect(service.reverse("https://myCustomUrl.org/v1/deep/nested")).toBe(
                "custom:deep/nested"
            )
        })

        it("should rewrite http to https before giving up", async () => {
            const service = await BaseContextService.newInstance(V1_1_CONTEXT)
            expect(service.reverse("http://schema.org/Person")).toBe("Person")
        })

        it("should rewrite http to https for custom pairs", async () => {
            const service = await BaseContextService.newInstance({
                "@vocab": V1_1_CONTEXT,
                ex: "https://example.org/v1/"
            })
            expect(service.reverse("http://example.org/v1/Thing")).toBe("ex:Thing")
        })

        it("should return null for an unknown URI", async () => {
            const service = await BaseContextService.newInstance(V1_1_CONTEXT)
            expect(service.reverse("https://unknown.org/something")).toBeNull()
        })

        it("should prefer the exact context match over a custom pair prefix", async () => {
            const service = await BaseContextService.newInstance({
                "@vocab": V1_3_CONTEXT,
                bio: "https://bioschemas.org/terms/"
            })
            expect(service.reverse("https://bioschemas.org/terms/input")).toBe("input")
        })
    })

    describe("addCustomContextPair", () => {
        let service: BaseContextService

        beforeEach(async () => {
            service = await BaseContextService.newInstance(V1_1_CONTEXT)
        })

        it("should store the pair and make it resolvable and reversible", async () => {
            await service.addCustomContextPair("ex", "https://example.org/")

            expect(service.customPairs).toEqual({ ex: "https://example.org/" })
            expect(service.resolve("ex:MyType")).toBe("https://example.org/MyType")
            expect(service.reverse("https://example.org/MyType")).toBe("ex:MyType")
        })

        it("should record the pair in the raw context as @vocab + pair", async () => {
            await service.addCustomContextPair("ex", "https://example.org/")

            expect(service.getRaw()).toEqual({
                "@vocab": V1_1_CONTEXT,
                ex: "https://example.org/"
            })
            expect(service.specification).toBe(RO_CRATE_VERSION.V1_1_3)
        })

        it("should keep the known context resolvable after adding a pair", async () => {
            await service.addCustomContextPair("ex", "https://example.org/")

            expect(service.resolve("Organization")).toBe("https://schema.org/Organization")
            expect(service.reverse("https://schema.org/Organization")).toBe("Organization")
        })

        it("should preserve previously added pairs", async () => {
            await service.addCustomContextPair("ex", "https://example.org/")
            await service.addCustomContextPair("other", "https://other.example.org/")

            expect(service.customPairs).toEqual({
                ex: "https://example.org/",
                other: "https://other.example.org/"
            })
        })

        it("should overwrite an existing pair with the same prefix", async () => {
            await service.addCustomContextPair("ex", "https://example.org/v1/")
            await service.addCustomContextPair("ex", "https://example.org/v2/")

            expect(service.customPairs).toEqual({ ex: "https://example.org/v2/" })
            expect(service.resolve("ex:Thing")).toBe("https://example.org/v2/Thing")
        })

        it("should emit context-changed with the new raw context", async () => {
            const listener = jest.fn()
            service.events.addEventListener("context-changed", listener)

            await service.addCustomContextPair("ex", "https://example.org/")

            expect(listener).toHaveBeenCalledWith({
                "@vocab": V1_1_CONTEXT,
                ex: "https://example.org/"
            })
        })

        it("should not emit context-changed when adding an identical pair", async () => {
            await service.addCustomContextPair("ex", "https://example.org/")

            const listener = jest.fn()
            service.events.addEventListener("context-changed", listener)
            await service.addCustomContextPair("ex", "https://example.org/")

            expect(listener).not.toHaveBeenCalled()
        })
    })

    describe("removeCustomContextPair", () => {
        let service: BaseContextService

        beforeEach(async () => {
            service = await BaseContextService.newInstance({
                "@vocab": V1_1_CONTEXT,
                ex: "https://example.org/"
            })
        })

        it("should remove the pair from customPairs and the raw context", async () => {
            await service.removeCustomContextPair("ex")

            expect(Object.keys(service.customPairs)).toHaveLength(0)
            expect(service.getRaw()).toEqual({ "@vocab": V1_1_CONTEXT })
            expect(service.specification).toBe(RO_CRATE_VERSION.V1_1_3)
        })

        it("should make the removed prefix unresolvable", async () => {
            const mock = spyOn(global.console, "warn").mockImplementation(() => {})
            await service.removeCustomContextPair("ex")

            expect(service.resolve("ex:Thing")).toBeNull()
            mock.mockRestore()
        })

        it("should emit context-changed with the updated raw context", async () => {
            const listener = jest.fn()
            service.events.addEventListener("context-changed", listener)

            await service.removeCustomContextPair("ex")

            expect(listener).toHaveBeenCalledWith({ "@vocab": V1_1_CONTEXT })
        })

        it("should not emit context-changed when removing an unknown prefix", async () => {
            const listener = jest.fn()
            service.events.addEventListener("context-changed", listener)

            await service.removeCustomContextPair("doesNotExist")

            expect(listener).not.toHaveBeenCalled()
            expect(service.customPairs).toEqual({ ex: "https://example.org/" })
        })
    })

    describe("getResolver", () => {
        it("should return a resolver that resolves and reverses", async () => {
            const service = await BaseContextService.newInstance(V1_1_CONTEXT)
            const resolver = service.getResolver()

            expect(resolver.resolve("Organization")).toBe("https://schema.org/Organization")
            expect(resolver.reverse("https://schema.org/Organization")).toBe("Organization")
            expect(resolver.resolve("completelyUnknownTerm")).toBeNull()
        })
    })

    describe("defensive cloning", () => {
        it("should return clones of context, customPairs and raw", async () => {
            const service = await BaseContextService.newInstance({
                "@vocab": V1_1_CONTEXT,
                ex: "https://example.org/"
            })

            const context = service.context
            context.ex = "https://mutated.example.org/"
            expect(service.context.ex).toBe("https://example.org/")

            const customPairs = service.customPairs
            delete customPairs.ex
            expect(service.customPairs).toEqual({ ex: "https://example.org/" })

            const raw = service.getRaw() as { ex: string }
            raw.ex = "https://mutated.example.org/"
            expect(service.getRaw()).toEqual({
                "@vocab": V1_1_CONTEXT,
                ex: "https://example.org/"
            })
        })
    })

    describe("before any update", () => {
        it("should have no raw context and no specification", () => {
            const service = new BaseContextService()

            expect(service.getRaw()).toBeUndefined()
            expect(service.specification).toBeUndefined()
            expect(service.usingFallback).toBe(false)
            expect(service.errors).toEqual([])
        })

        it("should return null for any resolution", () => {
            const service = new BaseContextService()

            expect(service.resolve("Organization")).toBeNull()
            expect(service.reverse("https://schema.org/Organization")).toBeNull()
        })
    })
})
