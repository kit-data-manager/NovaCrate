import { create } from "zustand/index"
import { immer } from "zustand/middleware/immer"
import { ValidationResult } from "@/lib/validation/validation-result"

export interface ValidationResultStore {
    results: ValidationResult[]
    clearResults(entityId?: string, propertyName?: string): void
    clear(): void
    addResults(result: ValidationResult[]): void
}

export const createValidationResultStore = () =>
    create<ValidationResultStore>()(
        immer((set) => ({
            results: [],
            clearResults(entityId?: string, propertyName?: string) {
                set((store) => {
                    store.results = store.results.filter((result) =>
                        entityId
                            ? propertyName
                                ? result.entityId !== entityId ||
                                  result.propertyName !== propertyName
                                : result.entityId !== entityId
                            : result.entityId !== undefined
                    )
                })
            },
            clear() {
                set({ results: [] })
            },
            addResults(result: ValidationResult[]) {
                set((store) => {
                    store.results.push(...result)
                })
            }
        }))
    )
