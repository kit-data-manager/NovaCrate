/**
 * @jest-environment jsdom
 */

import { operationState } from "@/lib/state/operation-state"

function resetStore() {
    operationState.setState({
        isSaving: false,
        saveErrors: new Map(),
        loadError: undefined,
        healthStatus: "unknown",
        healthError: undefined
    })
}

describe("operationState", () => {
    beforeEach(() => {
        resetStore()
    })

    describe("isSaving", () => {
        it("should default to false", () => {
            expect(operationState.getState().isSaving).toBe(false)
        })

        it("should be set to true", () => {
            operationState.getState().setIsSaving(true)
            expect(operationState.getState().isSaving).toBe(true)
        })

        it("should be toggled back to false", () => {
            operationState.getState().setIsSaving(true)
            operationState.getState().setIsSaving(false)
            expect(operationState.getState().isSaving).toBe(false)
        })
    })

    describe("saveErrors", () => {
        it("should default to an empty map", () => {
            expect(operationState.getState().saveErrors.size).toBe(0)
        })

        it("should add a save error for an entity", () => {
            operationState.getState().addSaveError("#a", new Error("failed"))
            const errors = operationState.getState().saveErrors
            expect(errors.size).toBe(1)
            expect(errors.get("#a")).toBeInstanceOf(Error)
            expect((errors.get("#a") as Error).message).toBe("failed")
        })

        it("should overwrite an existing save error for the same entity", () => {
            operationState.getState().addSaveError("#a", new Error("first"))
            operationState.getState().addSaveError("#a", new Error("second"))
            const errors = operationState.getState().saveErrors
            expect(errors.size).toBe(1)
            expect((errors.get("#a") as Error).message).toBe("second")
        })

        it("should track errors for multiple entities independently", () => {
            operationState.getState().addSaveError("#a", "error A")
            operationState.getState().addSaveError("#b", "error B")
            const errors = operationState.getState().saveErrors
            expect(errors.size).toBe(2)
            expect(errors.get("#a")).toBe("error A")
            expect(errors.get("#b")).toBe("error B")
        })

        it("should clear a single entity's error when id is provided", () => {
            operationState.getState().addSaveError("#a", "error A")
            operationState.getState().addSaveError("#b", "error B")
            operationState.getState().clearSaveError("#a")
            const errors = operationState.getState().saveErrors
            expect(errors.size).toBe(1)
            expect(errors.has("#a")).toBe(false)
            expect(errors.get("#b")).toBe("error B")
        })

        it("should clear all errors when no id is provided", () => {
            operationState.getState().addSaveError("#a", "error A")
            operationState.getState().addSaveError("#b", "error B")
            operationState.getState().clearSaveError()
            expect(operationState.getState().saveErrors.size).toBe(0)
        })

        it("should be a no-op when clearing a nonexistent entity id", () => {
            operationState.getState().addSaveError("#a", "error A")
            operationState.getState().clearSaveError("#nonexistent")
            expect(operationState.getState().saveErrors.size).toBe(1)
        })
    })

    describe("loadError", () => {
        it("should default to undefined", () => {
            expect(operationState.getState().loadError).toBeUndefined()
        })

        it("should set a load error", () => {
            const err = new Error("metadata fetch failed")
            operationState.getState().setLoadError(err)
            expect(operationState.getState().loadError).toBe(err)
        })

        it("should clear the load error when called without arguments", () => {
            operationState.getState().setLoadError(new Error("failed"))
            operationState.getState().setLoadError()
            expect(operationState.getState().loadError).toBeUndefined()
        })
    })

    describe("health status", () => {
        it("should default to unknown with no error", () => {
            const state = operationState.getState()
            expect(state.healthStatus).toBe("unknown")
            expect(state.healthError).toBeUndefined()
        })

        it("should set status to healthy", () => {
            operationState.getState().setHealthStatus("healthy")
            const state = operationState.getState()
            expect(state.healthStatus).toBe("healthy")
            expect(state.healthError).toBeUndefined()
        })

        it("should set status to unhealthy with error", () => {
            const err = new Error("worker down")
            operationState.getState().setHealthStatus("unhealthy", err)
            const state = operationState.getState()
            expect(state.healthStatus).toBe("unhealthy")
            expect(state.healthError).toBe(err)
        })

        it("should clear error when transitioning back to healthy", () => {
            operationState.getState().setHealthStatus("unhealthy", new Error("down"))
            operationState.getState().setHealthStatus("healthy")
            const state = operationState.getState()
            expect(state.healthStatus).toBe("healthy")
            expect(state.healthError).toBeUndefined()
        })
    })
})
