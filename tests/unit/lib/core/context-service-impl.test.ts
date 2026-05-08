import { ContextServiceImpl } from "@/lib/core/impl/ContextServiceImpl"
import { Observable } from "@/lib/core/impl/Observable"
import { IPersistenceAdapter, IPersistenceAdapterEvents } from "@/lib/core/IPersistenceAdapter"
import { RO_CRATE_VERSION } from "@/lib/constants"
import { spyOn } from "jest-mock"

function createMockPersistenceAdapter(
    context: CrateContextType = "https://w3id.org/ro/crate/1.1/context"
): IPersistenceAdapter & {
    _events: Observable<IPersistenceAdapterEvents>
} {
    const events = new Observable<IPersistenceAdapterEvents>()
    return {
        _events: events,
        events,
        getMetadataGraph: jest.fn(async () => []),
        getMetadataContext: jest.fn(async () => context),
        updateMetadataGraph: jest.fn(async () => {}),
        updateMetadataContext: jest.fn(async () => {})
    }
}

describe("ContextServiceImpl", () => {
    describe("newInstance with v1.1 string context", () => {
        let mockAdapter: ReturnType<typeof createMockPersistenceAdapter>
        let service: ContextServiceImpl

        beforeEach(async () => {
            mockAdapter = createMockPersistenceAdapter("https://w3id.org/ro/crate/1.1/context")
            service = await ContextServiceImpl.newInstance(mockAdapter)
        })

        it("should load the v1.1 specification", () => {
            expect(service.specification).toBe(RO_CRATE_VERSION.V1_1_3)
        })

        it("should not use fallback", () => {
            expect(service.usingFallback).toBe(false)
        })

        it("should have no custom pairs", () => {
            expect(Object.keys(service.customPairs).length).toBe(0)
        })

        it("should resolve schema.org types", () => {
            expect(service.resolve("Organization")).toBe("https://schema.org/Organization")
            expect(service.resolve("Person")).toBe("https://schema.org/Person")
            expect(service.resolve("hasPart")).toBe("https://schema.org/hasPart")
        })

        it("should return null for unknown types", () => {
            expect(service.resolve("completelyUnknownType")).toBeNull()
        })

        it("should reverse schema.org URIs", () => {
            expect(service.reverse("https://schema.org/Organization")).toBe("Organization")
            expect(service.reverse("https://schema.org/Person")).toBe("Person")
            expect(service.reverse("https://schema.org/hasPart")).toBe("hasPart")
        })

        it("should return null for unknown URIs in reverse", () => {
            expect(service.reverse("https://example.org/unknown")).toBeNull()
        })
    })

    describe("newInstance with v1.2 string context", () => {
        let service: ContextServiceImpl

        beforeEach(async () => {
            const mockAdapter = createMockPersistenceAdapter(
                "https://w3id.org/ro/crate/1.2/context"
            )
            service = await ContextServiceImpl.newInstance(mockAdapter)
        })

        it("should load the v1.2 specification", () => {
            expect(service.specification).toBe(RO_CRATE_VERSION.V1_2_0)
        })

        it("should not use fallback", () => {
            expect(service.usingFallback).toBe(false)
        })

        it("should resolve v1.2-specific types like issueTracker", () => {
            expect(service.resolve("issueTracker")).toBe(
                "https://codemeta.github.io/terms/issueTracker"
            )
        })

        it("should reverse v1.2-specific URIs", () => {
            expect(service.reverse("https://codemeta.github.io/terms/issueTracker")).toBe(
                "issueTracker"
            )
        })

        it("should still resolve common schema.org types", () => {
            expect(service.resolve("Organization")).toBe("https://schema.org/Organization")
        })
    })

    describe("newInstance with @vocab object context", () => {
        it("should work with object-style context using @vocab only", async () => {
            const mockAdapter = createMockPersistenceAdapter({
                "@vocab": "https://w3id.org/ro/crate/1.2/context"
            })
            const service = await ContextServiceImpl.newInstance(mockAdapter)

            expect(service.specification).toBe(RO_CRATE_VERSION.V1_2_0)
            expect(service.usingFallback).toBe(false)
            expect(service.resolve("Organization")).toBe("https://schema.org/Organization")
        })
    })

    describe("newInstance with @vocab + custom pairs in object context", () => {
        it("should retain the loaded known context alongside custom pairs", async () => {
            // This tests that the loaded context is not lost when custom pairs are processed.
            // The correct behavior: both the known context (e.g. Organization -> schema.org)
            // AND the custom prefix should be resolvable.
            const mockAdapter = createMockPersistenceAdapter({
                "@vocab": "https://w3id.org/ro/crate/1.2/context",
                custom: "https://example.org/schema/v1/"
            })
            const service = await ContextServiceImpl.newInstance(mockAdapter)

            expect(service.specification).toBe(RO_CRATE_VERSION.V1_2_0)

            // Custom pair should be stored
            expect(service.customPairs).toEqual({
                custom: "https://example.org/schema/v1/"
            })

            // Custom prefix resolution should work
            expect(service.resolve("custom:someType")).toBe(
                "https://example.org/schema/v1/someType"
            )
            expect(service.reverse("https://example.org/schema/v1/someType")).toBe(
                "custom:someType"
            )

            // The loaded known context should ALSO still be resolvable
            expect(service.resolve("Organization")).toBe("https://schema.org/Organization")
            expect(service.resolve("hasPart")).toBe("https://schema.org/hasPart")
            expect(service.reverse("https://schema.org/Organization")).toBe("Organization")
        })
    })

    describe("newInstance with array context", () => {
        it("should handle array with known string + custom object entries", async () => {
            const mockAdapter = createMockPersistenceAdapter([
                "https://w3id.org/ro/crate/1.1/context",
                { myPrefix: "https://example.org/myschema/" }
            ])
            const service = await ContextServiceImpl.newInstance(mockAdapter)

            expect(service.specification).toBe(RO_CRATE_VERSION.V1_1_3)

            // Known context types should be resolvable
            expect(service.resolve("Organization")).toBe("https://schema.org/Organization")

            // Custom pair should be stored and resolvable
            expect(service.customPairs).toEqual({
                myPrefix: "https://example.org/myschema/"
            })
            expect(service.resolve("myPrefix:myType")).toBe("https://example.org/myschema/myType")
        })
    })

    describe("newInstance with unknown context (fallback)", () => {
        it("should fall back to v1.1.3 when context is unknown", async () => {
            const mock = spyOn(global.console, "error").mockImplementation(() => {})
            const mockAdapter = createMockPersistenceAdapter("https://example.org/unknown-context")
            const service = await ContextServiceImpl.newInstance(mockAdapter)

            expect(service.usingFallback).toBe(true)
            expect(service.specification).toBe(RO_CRATE_VERSION.V1_1_3)
            expect(mock).toHaveBeenCalled()
            mock.mockRestore()
        })

        it("should still resolve types using fallback context", async () => {
            const mock = spyOn(global.console, "error").mockImplementation(() => {})
            const mockAdapter = createMockPersistenceAdapter("https://example.org/unknown-context")
            const service = await ContextServiceImpl.newInstance(mockAdapter)

            expect(service.resolve("Organization")).toBe("https://schema.org/Organization")
            mock.mockRestore()
        })
    })

    describe("newInstance with unknown @vocab", () => {
        it("should fall back when @vocab is an unknown URI", async () => {
            const mock = spyOn(global.console, "error").mockImplementation(() => {})
            const mockAdapter = createMockPersistenceAdapter({
                "@vocab": "https://example.org/unknown"
            })
            const service = await ContextServiceImpl.newInstance(mockAdapter)

            expect(service.usingFallback).toBe(true)
            expect(service.specification).toBe(RO_CRATE_VERSION.V1_1_3)
            mock.mockRestore()
        })
    })

    describe("resolve", () => {
        it("should resolve a known context entry directly", async () => {
            const mockAdapter = createMockPersistenceAdapter(
                "https://w3id.org/ro/crate/1.1/context"
            )
            const service = await ContextServiceImpl.newInstance(mockAdapter)
            expect(service.resolve("Person")).toBe("https://schema.org/Person")
        })

        it("should resolve a prefixed identifier using custom pairs", async () => {
            const mockAdapter = createMockPersistenceAdapter({
                "@vocab": "https://w3id.org/ro/crate/1.1/context",
                bio: "https://bioschemas.org/"
            })
            const service = await ContextServiceImpl.newInstance(mockAdapter)
            expect(service.resolve("bio:Gene")).toBe("https://bioschemas.org/Gene")
        })

        it("should return null for an unknown prefix", async () => {
            const mock = spyOn(global.console, "warn").mockImplementation(() => {})
            const mockAdapter = createMockPersistenceAdapter(
                "https://w3id.org/ro/crate/1.1/context"
            )
            const service = await ContextServiceImpl.newInstance(mockAdapter)
            expect(service.resolve("unknown:Type")).toBeNull()
            expect(mock).toHaveBeenCalled()
            mock.mockRestore()
        })

        it("should return null for a completely unknown identifier", async () => {
            const mockAdapter = createMockPersistenceAdapter(
                "https://w3id.org/ro/crate/1.1/context"
            )
            const service = await ContextServiceImpl.newInstance(mockAdapter)
            expect(service.resolve("totallyNonExistentThing")).toBeNull()
        })
    })

    describe("reverse", () => {
        it("should reverse a known URI to its short form", async () => {
            const mockAdapter = createMockPersistenceAdapter(
                "https://w3id.org/ro/crate/1.1/context"
            )
            const service = await ContextServiceImpl.newInstance(mockAdapter)
            expect(service.reverse("https://schema.org/Person")).toBe("Person")
        })

        it("should reverse a custom URI to its prefixed form", async () => {
            const mockAdapter = createMockPersistenceAdapter({
                "@vocab": "https://w3id.org/ro/crate/1.1/context",
                bio: "https://bioschemas.org/"
            })
            const service = await ContextServiceImpl.newInstance(mockAdapter)
            expect(service.reverse("https://bioschemas.org/Gene")).toBe("bio:Gene")
        })

        it("should return null for a completely unknown URI", async () => {
            const mockAdapter = createMockPersistenceAdapter(
                "https://w3id.org/ro/crate/1.1/context"
            )
            const service = await ContextServiceImpl.newInstance(mockAdapter)
            expect(service.reverse("https://unknown.org/something")).toBeNull()
        })
    })

    describe("addCustomContextPair", () => {
        let mockAdapter: ReturnType<typeof createMockPersistenceAdapter>
        let service: ContextServiceImpl

        beforeEach(async () => {
            mockAdapter = createMockPersistenceAdapter("https://w3id.org/ro/crate/1.1/context")
            service = await ContextServiceImpl.newInstance(mockAdapter)
        })

        it("should add a custom context pair", async () => {
            await service.addCustomContextPair("ex", "https://example.org/")

            expect(service.customPairs).toEqual({ ex: "https://example.org/" })
            expect(service.specification).toBe(RO_CRATE_VERSION.V1_1_3)
            expect(service.getRaw()).toEqual({
                "@vocab": "https://w3id.org/ro/crate/1.1/context",
                ex: "https://example.org/"
            })
        })

        it("should make the custom prefix resolvable", async () => {
            await service.addCustomContextPair("ex", "https://example.org/")

            expect(service.resolve("ex:MyType")).toBe("https://example.org/MyType")
        })

        it("should make the custom URI reversible", async () => {
            await service.addCustomContextPair("ex", "https://example.org/")

            expect(service.reverse("https://example.org/MyType")).toBe("ex:MyType")
        })

        it("should emit context-changed event", async () => {
            const listener = jest.fn()
            service.events.addEventListener("context-changed", listener)

            await service.addCustomContextPair("ex", "https://example.org/")

            expect(listener).toHaveBeenCalled()
        })

        it("should persist the updated context through the adapter", async () => {
            await service.addCustomContextPair("ex", "https://example.org/")

            expect(mockAdapter.updateMetadataContext).toHaveBeenCalled()
        })
    })

    describe("removeCustomContextPair", () => {
        let mockAdapter: ReturnType<typeof createMockPersistenceAdapter>
        let service: ContextServiceImpl

        beforeEach(async () => {
            mockAdapter = createMockPersistenceAdapter({
                "@vocab": "https://w3id.org/ro/crate/1.1/context",
                ex: "https://example.org/"
            })
            service = await ContextServiceImpl.newInstance(mockAdapter)
        })

        it("should remove the custom context pair", async () => {
            expect(service.customPairs).toHaveProperty("ex")

            await service.removeCustomContextPair("ex")

            expect(Object.keys(service.customPairs)).toHaveLength(0)
            expect(service.specification).toBe(RO_CRATE_VERSION.V1_1_3)
            expect(service.getRaw()).toEqual({
                "@vocab": "https://w3id.org/ro/crate/1.1/context"
            })
        })

        it("should emit context-changed event", async () => {
            const listener = jest.fn()
            service.events.addEventListener("context-changed", listener)

            await service.removeCustomContextPair("ex")

            expect(listener).toHaveBeenCalled()
        })

        it("should persist the updated context through the adapter", async () => {
            await service.removeCustomContextPair("ex")

            expect(mockAdapter.updateMetadataContext).toHaveBeenCalled()
        })
    })

    describe("getKnownContext (static)", () => {
        it("should return the v1.1 context entry", () => {
            const known = ContextServiceImpl.getKnownContext(
                "https://w3id.org/ro/crate/1.1/context"
            )
            expect(known).toBeDefined()
            expect(known!.version).toBe(RO_CRATE_VERSION.V1_1_3)
        })

        it("should return the v1.2 context entry", () => {
            const known = ContextServiceImpl.getKnownContext(
                "https://w3id.org/ro/crate/1.2/context"
            )
            expect(known).toBeDefined()
            expect(known!.version).toBe(RO_CRATE_VERSION.V1_2_0)
        })

        it("should return undefined for an unknown context ID", () => {
            const known = ContextServiceImpl.getKnownContext("https://example.org/unknown")
            expect(known).toBeUndefined()
        })
    })

    describe("context update from persistence adapter events", () => {
        it("should update specification when adapter emits a different context", async () => {
            const mockAdapter = createMockPersistenceAdapter(
                "https://w3id.org/ro/crate/1.1/context"
            )
            const service = await ContextServiceImpl.newInstance(mockAdapter)
            expect(service.specification).toBe(RO_CRATE_VERSION.V1_1_3)

            // Simulate persistence adapter emitting a context change
            mockAdapter._events.emit("context-changed", "https://w3id.org/ro/crate/1.2/context")

            // Allow async update to complete
            await new Promise((r) => setTimeout(r, 50))

            expect(service.specification).toBe(RO_CRATE_VERSION.V1_2_0)
        })

        it("should not re-process when the emitted context is identical", async () => {
            const mockAdapter = createMockPersistenceAdapter(
                "https://w3id.org/ro/crate/1.1/context"
            )
            const service = await ContextServiceImpl.newInstance(mockAdapter)

            const listener = jest.fn()
            service.events.addEventListener("context-changed", listener)

            // Emit same context string
            mockAdapter._events.emit("context-changed", "https://w3id.org/ro/crate/1.1/context")
            await new Promise((r) => setTimeout(r, 50))

            // Should not emit because JSON.stringify comparison should match
            expect(listener).not.toHaveBeenCalled()
        })
    })

    describe("dispose", () => {
        it("should stop listening to persistence adapter events", async () => {
            const mockAdapter = createMockPersistenceAdapter(
                "https://w3id.org/ro/crate/1.1/context"
            )
            const service = await ContextServiceImpl.newInstance(mockAdapter)

            service.dispose()

            // Emit a context change after disposal
            mockAdapter._events.emit("context-changed", "https://w3id.org/ro/crate/1.2/context")
            await new Promise((r) => setTimeout(r, 50))

            // Specification should remain v1.1 because the listener was removed
            expect(service.specification).toBe(RO_CRATE_VERSION.V1_1_3)
        })
    })
})
