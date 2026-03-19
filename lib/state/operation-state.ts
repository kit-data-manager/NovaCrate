import { immer } from "zustand/middleware/immer"
import { enableMapSet } from "immer"
import { createWithEqualityFn } from "zustand/traditional"
import { useStore } from "zustand"
import { unstable_ssrSafe as ssrSafe } from "zustand/middleware"

enableMapSet()

export type HealthStatus = "healthy" | "unhealthy" | "unknown"

/**
 * Tracks operation-level UI state: whether a save is in progress, per-entity
 * save errors, and persistence layer health. This store replaces the
 * `isSaving`, `saveError`, `clearSaveError`, and `healthTestError` fields
 * from the legacy `CrateDataProvider`.
 *
 * Accessed via {@link useOperationState} or directly via {@link operationState}.
 */
export interface OperationState {
    // ── Saving state ────────────────────────────────────────────────────

    /** True while a save/create operation is in progress. */
    isSaving: boolean
    /** Set whether a save operation is currently in progress. */
    setIsSaving(value: boolean): void

    // ── Per-entity save errors ──────────────────────────────────────────

    /** Map of entity `@id` to the most recent error encountered while saving. */
    saveErrors: Map<string, unknown>
    /** Record a save error for the given entity. */
    addSaveError(entityId: string, error: unknown): void
    /**
     * Clear save errors. If `id` is provided, clears only that entity's error.
     * If omitted, clears all save errors.
     */
    clearSaveError(id?: string): void

    // ── Persistence health ──────────────────────────────────────────────

    /**
     * Current health status of the persistence layer.
     * - `"unknown"` — initial state before the first health check runs.
     * - `"healthy"` — the last health check succeeded.
     * - `"unhealthy"` — the last health check failed.
     */
    healthStatus: HealthStatus
    /** The error from the last failed health check, or `undefined` if healthy. */
    healthError: unknown
    /** Update the health status and optional error. */
    setHealthStatus(status: HealthStatus, error?: unknown): void
}

export const operationState = createWithEqualityFn<OperationState>()(
    ssrSafe(
        immer<OperationState>((setState) => ({
            isSaving: false,
            setIsSaving(value: boolean) {
                setState((state) => {
                    state.isSaving = value
                })
            },

            saveErrors: new Map<string, unknown>(),
            addSaveError(entityId: string, error: unknown) {
                setState((state) => {
                    state.saveErrors.set(entityId, error)
                })
            },
            clearSaveError(id?: string) {
                setState((state) => {
                    if (id) {
                        state.saveErrors.delete(id)
                    } else {
                        state.saveErrors.clear()
                    }
                })
            },

            healthStatus: "unknown" as HealthStatus,
            healthError: undefined,
            setHealthStatus(status: HealthStatus, error?: unknown) {
                setState((state) => {
                    state.healthStatus = status
                    state.healthError = error
                })
            }
        }))
    )
)

export function useOperationState<T>(selector: (store: OperationState) => T): T {
    return useStore(operationState, selector)
}
