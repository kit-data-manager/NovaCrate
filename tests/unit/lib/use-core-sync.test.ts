/**
 * @jest-environment jsdom
 */

/**
 * Tests for the {@link useCoreSync} hook.
 *
 * Uses jsdom so that Zustand's ssrSafe middleware allows setState, and
 * React Testing Library's renderHook exercises the real hook lifecycle.
 */

// Polyfill structuredClone for jsdom (not available in all jsdom versions).
// Uses JSON round-trip which is sufficient for the plain objects used here.
if (typeof structuredClone === "undefined") {
    ;(globalThis as any).structuredClone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
}

import { renderHook, act, cleanup as rtlCleanup } from "@testing-library/react"
import { Observable } from "@/lib/core/impl/Observable"
import { IMetadataServiceEvents, IMetadataService } from "@/lib/core/IMetadataService"
import { IContextServiceEvents, IContextService } from "@/lib/core/IContextService"
import { ICoreService } from "@/lib/core/ICoreService"
import { editorState } from "@/lib/state/editor-state"
import { useCoreSync } from "@/lib/use-core-sync"
import { RO_CRATE_VERSION } from "@/lib/constants"

// ─── Helpers ───────────────────────────────────────────────────────────────

function createMockMetadataService(
    initialEntities: IEntity[] = []
): IMetadataService & { _events: Observable<IMetadataServiceEvents> } {
    const _events = new Observable<IMetadataServiceEvents>()
    return {
        _events,
        events: _events,
        getEntities: () => structuredClone(initialEntities),
        addEntity: jest.fn(),
        updateEntity: jest.fn(),
        changeEntityIdentifier: jest.fn(),
        deleteEntity: jest.fn()
    }
}

function createMockContextService(
    rawContext: CrateContextType = "https://w3id.org/ro/crate/1.1/context",
    options?: {
        specification?: RO_CRATE_VERSION
        customPairs?: Record<string, string>
        context?: Record<string, string>
        errors?: unknown[]
    }
): IContextService & { _events: Observable<IContextServiceEvents> } {
    const _events = new Observable<IContextServiceEvents>()
    return {
        _events,
        events: _events,
        specification: options?.specification,
        usingFallback: false,
        customPairs: options?.customPairs ?? {},
        context: options?.context ?? {},
        errors: options?.errors ?? [],
        getRaw: () => structuredClone(rawContext),
        removeCustomContextPair: jest.fn(),
        addCustomContextPair: jest.fn(),
        getResolver: jest.fn()
    }
}

function createMockCoreService(
    metadataService: IMetadataService,
    contextService: IContextService
): ICoreService {
    return {
        getMetadataService: () => metadataService,
        getContextService: () => contextService,
        addFileEntity: jest.fn(),
        addFolderEntity: jest.fn(),
        changeEntityIdentifier: jest.fn(),
        deleteEntity: jest.fn()
    }
}

function resetEditorState() {
    editorState.setState({
        entities: new Map(),
        initialEntities: new Map()
    })
}

// ─── Test fixtures ─────────────────────────────────────────────────────────

const ENTITY_A: IEntity = { "@id": "#a", "@type": ["Thing"], name: "Entity A" }
const ENTITY_B: IEntity = { "@id": "#b", "@type": ["Person"], name: "Entity B" }
const ENTITY_C: IEntity = { "@id": "#c", "@type": ["Organization"], name: "Entity C" }

function clone<T>(obj: T): T {
    return structuredClone(obj)
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("useCoreSync", () => {
    beforeEach(() => {
        resetEditorState()
    })

    afterEach(() => {
        rtlCleanup()
    })

    describe("initial population", () => {
        it("should populate entities and initialEntities from the metadata service", () => {
            const entities = [clone(ENTITY_A), clone(ENTITY_B)]
            const metadataService = createMockMetadataService(entities)
            const contextService = createMockContextService()
            const core = createMockCoreService(metadataService, contextService)

            renderHook(() => useCoreSync(core))

            const state = editorState.getState()
            expect(state.entities.size).toBe(2)
            expect(state.entities.get("#a")?.name).toBe("Entity A")
            expect(state.entities.get("#b")?.name).toBe("Entity B")
            expect(state.initialEntities.size).toBe(2)
            expect(state.initialEntities.get("#a")?.name).toBe("Entity A")
            expect(state.initialEntities.get("#b")?.name).toBe("Entity B")
        })

        it("should set crateContextReady to true on mount when context is available", () => {
            const metadataService = createMockMetadataService([])
            const contextService = createMockContextService(
                "https://w3id.org/ro/crate/1.2/context",
                { specification: RO_CRATE_VERSION.V1_2_0 }
            )
            const core = createMockCoreService(metadataService, contextService)

            renderHook(() => useCoreSync(core))

            // Context is now set synchronously via setCrateContext
            expect(editorState.getState().crateContextReady).toBe(true)
        })

        it("should populate crateContext snapshot from the context service", () => {
            const metadataService = createMockMetadataService([])
            const contextService = createMockContextService(
                "https://w3id.org/ro/crate/1.2/context",
                {
                    specification: RO_CRATE_VERSION.V1_2_0,
                    customPairs: { ex: "https://example.org/" },
                    context: { Person: "https://schema.org/Person" }
                }
            )
            const core = createMockCoreService(metadataService, contextService)

            renderHook(() => useCoreSync(core))

            const state = editorState.getState()
            expect(state.crateContext.specification).toBe(RO_CRATE_VERSION.V1_2_0)
            expect(state.crateContext.customPairs).toEqual({ ex: "https://example.org/" })
            expect(state.crateContext.context).toEqual({ Person: "https://schema.org/Person" })
        })

        it("should handle empty initial entities", () => {
            const metadataService = createMockMetadataService([])
            const contextService = createMockContextService()
            const core = createMockCoreService(metadataService, contextService)

            renderHook(() => useCoreSync(core))

            const state = editorState.getState()
            expect(state.entities.size).toBe(0)
            expect(state.initialEntities.size).toBe(0)
        })

        it("should be a no-op when core is null", () => {
            renderHook(() => useCoreSync(null))

            const state = editorState.getState()
            expect(state.entities.size).toBe(0)
            expect(state.initialEntities.size).toBe(0)
        })
    })

    describe("graph-changed event", () => {
        it("should hard-replace entities on first event when lastGraph was empty", () => {
            const metadataService = createMockMetadataService([])
            const contextService = createMockContextService()
            const core = createMockCoreService(metadataService, contextService)

            renderHook(() => useCoreSync(core))

            act(() => {
                metadataService._events.emit("graph-changed", [clone(ENTITY_A), clone(ENTITY_B)])
            })

            const state = editorState.getState()
            expect(state.entities.size).toBe(2)
            expect(state.entities.get("#a")?.name).toBe("Entity A")
            expect(state.initialEntities.size).toBe(2)
        })

        it("should update initialEntities on every graph-changed event", () => {
            const metadataService = createMockMetadataService([clone(ENTITY_A)])
            const contextService = createMockContextService()
            const core = createMockCoreService(metadataService, contextService)

            renderHook(() => useCoreSync(core))

            act(() => {
                metadataService._events.emit("graph-changed", [clone(ENTITY_A), clone(ENTITY_B)])
            })

            const state = editorState.getState()
            expect(state.initialEntities.size).toBe(2)
            expect(state.initialEntities.get("#b")?.name).toBe("Entity B")
        })

        it("should apply three-way merge on subsequent events preserving local edits", () => {
            const metadataService = createMockMetadataService([clone(ENTITY_A), clone(ENTITY_B)])
            const contextService = createMockContextService()
            const core = createMockCoreService(metadataService, contextService)

            renderHook(() => useCoreSync(core))

            // Simulate a local edit: change Entity A's name locally
            act(() => {
                editorState.setState((state) => {
                    const entity = state.entities.get("#a")
                    if (entity) {
                        state.entities.set("#a", {
                            ...entity,
                            name: "Entity A (locally edited)"
                        })
                    }
                })
            })

            expect(editorState.getState().entities.get("#a")?.name).toBe(
                "Entity A (locally edited)"
            )

            // Server adds Entity C but does NOT change Entity A
            act(() => {
                metadataService._events.emit("graph-changed", [
                    clone(ENTITY_A), // unchanged on server
                    clone(ENTITY_B),
                    clone(ENTITY_C) // new from server
                ])
            })

            const state = editorState.getState()
            // Local edit should be preserved (server didn't change #a's name)
            expect(state.entities.get("#a")?.name).toBe("Entity A (locally edited)")
            // New entity from server should appear
            expect(state.entities.get("#c")?.name).toBe("Entity C")
            // Entity B should still be there
            expect(state.entities.get("#b")?.name).toBe("Entity B")
        })

        it("should overwrite local edits when server changes the same property", () => {
            const metadataService = createMockMetadataService([clone(ENTITY_A)])
            const contextService = createMockContextService()
            const core = createMockCoreService(metadataService, contextService)

            renderHook(() => useCoreSync(core))

            // Simulate a local edit
            act(() => {
                editorState.setState((state) => {
                    const entity = state.entities.get("#a")
                    if (entity) {
                        state.entities.set("#a", { ...entity, name: "Local name" })
                    }
                })
            })

            // Server also changes Entity A's name
            act(() => {
                metadataService._events.emit("graph-changed", [
                    { "@id": "#a", "@type": ["Thing"], name: "Server name" }
                ])
            })

            const state = editorState.getState()
            // Server change wins (three-way merge detects server changed `name`)
            expect(state.entities.get("#a")?.name).toBe("Server name")
        })

        it("should remove entities deleted on server via three-way merge", () => {
            const metadataService = createMockMetadataService([clone(ENTITY_A), clone(ENTITY_B)])
            const contextService = createMockContextService()
            const core = createMockCoreService(metadataService, contextService)

            renderHook(() => useCoreSync(core))

            // Server removes Entity B
            act(() => {
                metadataService._events.emit("graph-changed", [clone(ENTITY_A)])
            })

            const state = editorState.getState()
            expect(state.entities.size).toBe(1)
            expect(state.entities.has("#b")).toBe(false)
            expect(state.entities.get("#a")?.name).toBe("Entity A")
        })
    })

    describe("context-changed event", () => {
        it("should update crateContext snapshot on context-changed", () => {
            const metadataService = createMockMetadataService([])
            const contextService = createMockContextService(
                "https://w3id.org/ro/crate/1.1/context",
                { specification: RO_CRATE_VERSION.V1_1_3 }
            )
            const core = createMockCoreService(metadataService, contextService)

            renderHook(() => useCoreSync(core))

            // Verify initial state
            expect(editorState.getState().crateContext.specification).toBe(RO_CRATE_VERSION.V1_1_3)

            // Update the mock service's state to simulate what ContextServiceImpl
            // would do internally when the context changes
            ;(contextService as any).specification = RO_CRATE_VERSION.V1_2_0
            ;(contextService as any).customPairs = { ex: "https://example.org/" }

            // Emit context-changed with a new raw context
            const newContext: CrateContextType = "https://w3id.org/ro/crate/1.2/context"
            act(() => {
                contextService._events.emit("context-changed", newContext)
            })

            const state = editorState.getState()
            expect(state.crateContext.specification).toBe(RO_CRATE_VERSION.V1_2_0)
            expect(state.crateContext.customPairs).toEqual({ ex: "https://example.org/" })
            expect(state.crateContextReady).toBe(true)
        })

        it("should skip update when raw context is unchanged", () => {
            const metadataService = createMockMetadataService([])
            const contextService = createMockContextService(
                "https://w3id.org/ro/crate/1.1/context",
                { specification: RO_CRATE_VERSION.V1_1_3 }
            )
            const core = createMockCoreService(metadataService, contextService)

            renderHook(() => useCoreSync(core))

            // Spy on setCrateContext
            const setCrateContextSpy = jest.fn()
            const originalSetCrateContext = editorState.getState().setCrateContext
            editorState.setState({ setCrateContext: setCrateContextSpy })

            // Emit the same context again
            act(() => {
                contextService._events.emit(
                    "context-changed",
                    "https://w3id.org/ro/crate/1.1/context"
                )
            })

            // Should not have been called (dedup via JSON.stringify)
            expect(setCrateContextSpy).not.toHaveBeenCalled()

            // Restore
            editorState.setState({ setCrateContext: originalSetCrateContext })
        })

        it("should handle array context values", () => {
            const metadataService = createMockMetadataService([])
            const contextService = createMockContextService(
                "https://w3id.org/ro/crate/1.1/context",
                { specification: RO_CRATE_VERSION.V1_1_3 }
            )
            const core = createMockCoreService(metadataService, contextService)

            renderHook(() => useCoreSync(core))

            // Update mock service state
            ;(contextService as any).specification = RO_CRATE_VERSION.V1_2_0

            const newContext: CrateContextType = [
                "https://w3id.org/ro/crate/1.2/context",
                { ex: "https://example.org/" }
            ]
            act(() => {
                contextService._events.emit("context-changed", newContext)
            })

            expect(editorState.getState().crateContext.specification).toBe(RO_CRATE_VERSION.V1_2_0)
            expect(editorState.getState().crateContextReady).toBe(true)
        })
    })

    describe("cleanup", () => {
        it("should remove event listeners when the hook unmounts", () => {
            const metadataService = createMockMetadataService([clone(ENTITY_A)])
            const contextService = createMockContextService()
            const core = createMockCoreService(metadataService, contextService)

            const { unmount } = renderHook(() => useCoreSync(core))

            expect(editorState.getState().entities.size).toBe(1)

            // Unmount triggers the useEffect cleanup
            unmount()

            // Emit events after unmount — should have no effect
            metadataService._events.emit("graph-changed", [
                clone(ENTITY_A),
                clone(ENTITY_B),
                clone(ENTITY_C)
            ])

            expect(editorState.getState().entities.size).toBe(1)
        })

        it("should re-subscribe when core changes", () => {
            const metadataService1 = createMockMetadataService([clone(ENTITY_A)])
            const contextService1 = createMockContextService()
            const core1 = createMockCoreService(metadataService1, contextService1)

            const metadataService2 = createMockMetadataService([clone(ENTITY_B)])
            const contextService2 = createMockContextService()
            const core2 = createMockCoreService(metadataService2, contextService2)

            const { rerender } = renderHook(({ core }) => useCoreSync(core), {
                initialProps: { core: core1 as ICoreService | null }
            })

            expect(editorState.getState().entities.size).toBe(1)
            expect(editorState.getState().entities.has("#a")).toBe(true)

            // Switch to core2
            rerender({ core: core2 })

            expect(editorState.getState().entities.size).toBe(1)
            expect(editorState.getState().entities.has("#b")).toBe(true)

            // Old core's events should no longer affect state
            metadataService1._events.emit("graph-changed", [
                clone(ENTITY_A),
                clone(ENTITY_B),
                clone(ENTITY_C)
            ])
            expect(editorState.getState().entities.size).toBe(1)
            expect(editorState.getState().entities.has("#b")).toBe(true)
        })
    })
})
