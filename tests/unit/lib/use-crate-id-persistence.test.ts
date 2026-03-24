/**
 * @jest-environment jsdom
 */

import { renderHook, act, cleanup as rtlCleanup } from "@testing-library/react"
import { Observable } from "@/lib/core/impl/Observable"
import {
    IPersistenceService,
    IPersistenceServiceEvents
} from "@/lib/core/persistence/IPersistenceService"
import { useCrateIdPersistence } from "@/lib/hooks/use-crate-id-persistence"

// ─── Helpers ───────────────────────────────────────────────────────────────

function createMockPersistence(
    opts: { canSetCrateId?: boolean; crateId?: string | null } = {}
): IPersistenceService & { _events: Observable<IPersistenceServiceEvents> } {
    const _events = new Observable<IPersistenceServiceEvents>()
    return {
        _events,
        events: _events,
        getCrateId: jest.fn(() => opts.crateId ?? null),
        canSetCrateId: jest.fn(() => opts.canSetCrateId ?? true),
        setCrateId: jest.fn(),
        getCrateService: jest.fn(() => null),
        createCrateServiceFor: jest.fn(async () => null),
        getRepositoryService: jest.fn(() => null),
        healthCheck: jest.fn(async () => {})
    }
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("useCrateIdPersistence", () => {
    beforeEach(() => {
        localStorage.clear()
    })

    afterEach(() => {
        rtlCleanup()
    })

    describe("restore from localStorage on mount", () => {
        it("should call setCrateId with the stored value when canSetCrateId is true", () => {
            localStorage.setItem("crate-id", "test-crate-123")
            const persistence = createMockPersistence()

            renderHook(() => useCrateIdPersistence(persistence))

            expect(persistence.setCrateId).toHaveBeenCalledWith("test-crate-123")
        })

        it("should not call setCrateId when localStorage is empty", () => {
            const persistence = createMockPersistence()

            renderHook(() => useCrateIdPersistence(persistence))

            expect(persistence.setCrateId).not.toHaveBeenCalled()
        })

        it("should not call setCrateId when canSetCrateId returns false", () => {
            localStorage.setItem("crate-id", "test-crate-123")
            const persistence = createMockPersistence({ canSetCrateId: false })

            renderHook(() => useCrateIdPersistence(persistence))

            expect(persistence.setCrateId).not.toHaveBeenCalled()
        })
    })

    describe("persist crate-id-changed events to localStorage", () => {
        it("should write to localStorage when a non-null crate ID is emitted", () => {
            const persistence = createMockPersistence()

            renderHook(() => useCrateIdPersistence(persistence))

            act(() => {
                persistence._events.emit("crate-id-changed", "new-crate-456")
            })

            expect(localStorage.getItem("crate-id")).toBe("new-crate-456")
        })

        it("should remove from localStorage when null is emitted", () => {
            localStorage.setItem("crate-id", "old-crate")
            const persistence = createMockPersistence()

            renderHook(() => useCrateIdPersistence(persistence))

            act(() => {
                persistence._events.emit("crate-id-changed", null)
            })

            expect(localStorage.getItem("crate-id")).toBeNull()
        })

        it("should update localStorage on successive changes", () => {
            const persistence = createMockPersistence()

            renderHook(() => useCrateIdPersistence(persistence))

            act(() => {
                persistence._events.emit("crate-id-changed", "crate-A")
            })
            expect(localStorage.getItem("crate-id")).toBe("crate-A")

            act(() => {
                persistence._events.emit("crate-id-changed", "crate-B")
            })
            expect(localStorage.getItem("crate-id")).toBe("crate-B")
        })
    })

    describe("cleanup", () => {
        it("should stop listening to events after unmount", () => {
            const persistence = createMockPersistence()

            const { unmount } = renderHook(() => useCrateIdPersistence(persistence))

            unmount()

            // Emit after unmount — should have no effect
            persistence._events.emit("crate-id-changed", "should-not-persist")
            expect(localStorage.getItem("crate-id")).toBeNull()
        })
    })
})
