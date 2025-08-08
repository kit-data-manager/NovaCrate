import { create } from "zustand/index"
import { immer } from "zustand/middleware/immer"
import { ValidationResult } from "@/lib/validation/validation-result"

export interface ValidationResultStore {
    results: ValidationResult[]
    ranAtLeastOnce: boolean
    clearResults(entityId?: string, propertyName?: string): void
    clear(): void
    addResults(result: ValidationResult[]): void
}

export const createValidationResultStore = () =>
    create<ValidationResultStore>()(
        immer((set) => ({
            results: [],
            ranAtLeastOnce: false,
            clearResults(entityId?: string, propertyName?: string) {
                set((store) => {
                    store.results = store.results.filter((result) =>
                        entityId
                            ? propertyName
                                ? result.entityId !== entityId ||
                                  result.propertyName !== propertyName
                                : result.entityId !== entityId || result.propertyName !== undefined
                            : result.entityId !== undefined
                    )
                })
            },
            clear() {
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
