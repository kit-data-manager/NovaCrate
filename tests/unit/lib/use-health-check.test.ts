/**
 * @jest-environment jsdom
 */

// Polyfill structuredClone for jsdom if needed.
if (typeof structuredClone === "undefined") {
    ;(globalThis as any).structuredClone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
}

import { renderHook, act, cleanup as rtlCleanup } from "@testing-library/react"
import { IPersistenceService } from "@/lib/core/persistence/IPersistenceService"
import { Observable } from "@/lib/core/impl/Observable"
import { operationState } from "@/lib/state/operation-state"
import { useHealthCheck } from "@/lib/use-health-check"

// Mock sonner toast
jest.mock("sonner", () => ({
    toast: {
        info: jest.fn(),
        error: jest.fn()
    }
}))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { toast } = require("sonner")

// ─── Helpers ───────────────────────────────────────────────────────────────

function createMockPersistence(
    healthCheckImpl: () => Promise<void> = async () => {}
): IPersistenceService {
    return {
        events: new Observable(),
        getCrateId: jest.fn(() => null),
        canSetCrateId: jest.fn(() => true),
        setCrateId: jest.fn(),
        getCrateService: jest.fn(() => null),
        createCrateServiceFor: jest.fn(async () => null),
        getRepositoryService: jest.fn(() => null),
        healthCheck: jest.fn(healthCheckImpl)
    }
}

function resetOperationState() {
    operationState.setState({
        isSaving: false,
        saveErrors: new Map(),
        healthStatus: "unknown",
        healthError: undefined
    })
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("useHealthCheck", () => {
    beforeEach(() => {
        resetOperationState()
        jest.useFakeTimers()
        jest.clearAllMocks()
    })

    afterEach(() => {
        rtlCleanup()
        jest.useRealTimers()
    })

    it("should call healthCheck immediately on mount", async () => {
        const persistence = createMockPersistence()

        await act(async () => {
            renderHook(() => useHealthCheck(persistence))
        })

        expect(persistence.healthCheck).toHaveBeenCalledTimes(1)
    })

    it("should set healthStatus to healthy on successful check", async () => {
        const persistence = createMockPersistence(async () => {})

        await act(async () => {
            renderHook(() => useHealthCheck(persistence))
        })

        expect(operationState.getState().healthStatus).toBe("healthy")
        expect(operationState.getState().healthError).toBeUndefined()
    })

    it("should set healthStatus to unhealthy on failed check", async () => {
        const error = new Error("worker down")
        const persistence = createMockPersistence(async () => {
            throw error
        })

        await act(async () => {
            renderHook(() => useHealthCheck(persistence))
        })

        expect(operationState.getState().healthStatus).toBe("unhealthy")
        expect(operationState.getState().healthError).toBe(error)
    })

    it("should poll healthCheck at 10-second intervals", async () => {
        const persistence = createMockPersistence()

        await act(async () => {
            renderHook(() => useHealthCheck(persistence))
        })

        expect(persistence.healthCheck).toHaveBeenCalledTimes(1)

        // Advance 10 seconds
        await act(async () => {
            jest.advanceTimersByTime(10_000)
        })
        expect(persistence.healthCheck).toHaveBeenCalledTimes(2)

        // Advance another 10 seconds
        await act(async () => {
            jest.advanceTimersByTime(10_000)
        })
        expect(persistence.healthCheck).toHaveBeenCalledTimes(3)
    })

    it("should fire toast.error on transition from unknown to unhealthy", async () => {
        const persistence = createMockPersistence(async () => {
            throw new Error("down")
        })

        await act(async () => {
            renderHook(() => useHealthCheck(persistence))
        })

        expect(toast.error).toHaveBeenCalledWith("Crate service is no longer reachable")
    })

    it("should NOT fire toast.info on transition from unknown to healthy", async () => {
        const persistence = createMockPersistence(async () => {})

        await act(async () => {
            renderHook(() => useHealthCheck(persistence))
        })

        expect(toast.info).not.toHaveBeenCalled()
    })

    it("should fire toast.info on transition from unhealthy to healthy", async () => {
        // Start unhealthy
        operationState.getState().setHealthStatus("unhealthy", new Error("was down"))

        const persistence = createMockPersistence(async () => {})

        await act(async () => {
            renderHook(() => useHealthCheck(persistence))
        })

        expect(toast.info).toHaveBeenCalledWith("Crate service has recovered")
    })

    it("should NOT fire repeated toast.error when already unhealthy", async () => {
        // Start already unhealthy
        operationState.getState().setHealthStatus("unhealthy", new Error("was down"))

        const persistence = createMockPersistence(async () => {
            throw new Error("still down")
        })

        await act(async () => {
            renderHook(() => useHealthCheck(persistence))
        })

        expect(toast.error).not.toHaveBeenCalled()
    })

    it("should stop polling after unmount", async () => {
        const persistence = createMockPersistence()

        let unmountFn: () => void
        await act(async () => {
            const { unmount } = renderHook(() => useHealthCheck(persistence))
            unmountFn = unmount
        })

        expect(persistence.healthCheck).toHaveBeenCalledTimes(1)

        act(() => {
            unmountFn!()
        })

        // Advance time — should not trigger more calls
        await act(async () => {
            jest.advanceTimersByTime(30_000)
        })

        expect(persistence.healthCheck).toHaveBeenCalledTimes(1)
    })
})
