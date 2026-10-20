import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { ValidationResult } from "@/lib/validation/validation-result"
import { unstable_ssrSafe as ssrSafe } from "zustand/middleware"

export interface ValidationResultStore {
    results: ValidationResult[]
    ranAtLeastOnce: boolean

    /**
     * Clear all entries based on the trace of the validation result.
     * @param entityId EntityId of results to remove. Leave undefined to remove all entries that have no entityId.
     * @param propertyName name of the property that was validated. Leave undefined to remove all entries that have no propertyName.
     */
    clearByEntityIdOrPropertyName(entityId?: string, propertyName?: string): void
    clearAll(): void
    addResults(result: ValidationResult[]): void
}

export const createValidationResultStore = () =>
    create<ValidationResultStore>()(
        ssrSafe(
            immer((set) => ({
                results: [],
                ranAtLeastOnce: false,
                clearByEntityIdOrPropertyName(entityId?: string, propertyName?: string) {
                    set((store) => {
                        store.results = store.results.filter((result) =>
                            entityId
                                ? propertyName
                                    ? result.trace.entityId !== entityId ||
                                      result.trace.propertyName !== propertyName
                                    : result.trace.entityId !== entityId ||
                                      result.trace.propertyName !== null
                                : result.trace.entityId !== null
                        )
                    })
                },
                clearAll() {
                    set({ results: [] })
                },
                addResults(result: ValidationResult[]) {
                    set({ ranAtLeastOnce: true })
                    set((store) => {
                        store.results.push(...result)
                    })
                }
            }))
        )
    )
