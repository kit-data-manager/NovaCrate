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

// ─── Helpers ───────────────────────────────────────────────────────────────

function createMockMetadataService(
    initialEntities: IEntity[] = []
): IMetadataService & { _events: Observable<IMetadataServiceEvents> } {
    const _events = new Observable<IMetadataServiceEvents>()
    return {
        _events,
        events: _events,
        getEntities: () => JSON.parse(JSON.stringify(initialEntities)),
        addEntity: jest.fn(),
        updateEntity: jest.fn(),
        changeEntityIdentifier: jest.fn(),
        deleteEntity: jest.fn()
    }
}

function createMockContextService(
    rawContext: CrateContextType = "https://w3id.org/ro/crate/1.1/context"
): IContextService & { _events: Observable<IContextServiceEvents> } {
    const _events = new Observable<IContextServiceEvents>()
    return {
        _events,
        events: _events,
        specification: undefined,
        usingFallback: false,
        customPairs: {},
        getRaw: () => JSON.parse(JSON.stringify(rawContext)),
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

/** Deep clone via JSON round-trip (avoids structuredClone cross-realm issues in Jest). */
function clone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
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

        it("should call context update methods with the raw context on mount", () => {
            const metadataService = createMockMetadataService([])
            const contextService = createMockContextService("https://w3id.org/ro/crate/1.2/context")
            const core = createMockCoreService(metadataService, contextService)

            // updateCrateContext sets crateContextReady = false synchronously
            // before its async resolution. Verifying this side-effect confirms
            // the method was called.
            renderHook(() => useCoreSync(core))

            expect(editorState.getState().crateContextReady).toBe(false)
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
        it("should call updateCrateContext and updateInitialCrateContext", () => {
            const metadataService = createMockMetadataService([])
            const contextService = createMockContextService("https://w3id.org/ro/crate/1.1/context")
            const core = createMockCoreService(metadataService, contextService)

            // Spy on the store methods
            const updateCrateContextSpy = jest.fn()
            const updateInitialCrateContextSpy = jest.fn()
            const originalState = editorState.getState()
            editorState.setState({
                updateCrateContext: updateCrateContextSpy,
                updateInitialCrateContext: updateInitialCrateContextSpy
            })

            renderHook(() => useCoreSync(core))

            // Reset spy call counts from initial population
            updateCrateContextSpy.mockClear()
            updateInitialCrateContextSpy.mockClear()

            // Emit context-changed with a new context
            const newContext: CrateContextType = "https://w3id.org/ro/crate/1.2/context"
            act(() => {
                contextService._events.emit("context-changed", newContext)
            })

            expect(updateCrateContextSpy).toHaveBeenCalledWith(newContext)
            expect(updateInitialCrateContextSpy).toHaveBeenCalledWith(newContext)

            // Restore original methods
            editorState.setState({
                updateCrateContext: originalState.updateCrateContext,
                updateInitialCrateContext: originalState.updateInitialCrateContext
            })
        })

        it("should handle array context values", () => {
            const metadataService = createMockMetadataService([])
            const contextService = createMockContextService("https://w3id.org/ro/crate/1.1/context")
            const core = createMockCoreService(metadataService, contextService)

            const updateCrateContextSpy = jest.fn()
            const updateInitialCrateContextSpy = jest.fn()
            const originalState = editorState.getState()
            editorState.setState({
                updateCrateContext: updateCrateContextSpy,
                updateInitialCrateContext: updateInitialCrateContextSpy
            })

            renderHook(() => useCoreSync(core))

            updateCrateContextSpy.mockClear()
            updateInitialCrateContextSpy.mockClear()

            const newContext: CrateContextType = [
                "https://w3id.org/ro/crate/1.2/context",
                { ex: "https://example.org/" }
            ]
            act(() => {
                contextService._events.emit("context-changed", newContext)
            })

            expect(updateCrateContextSpy).toHaveBeenCalledWith(newContext)
            expect(updateInitialCrateContextSpy).toHaveBeenCalledWith(newContext)

            editorState.setState({
                updateCrateContext: originalState.updateCrateContext,
                updateInitialCrateContext: originalState.updateInitialCrateContext
            })
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
