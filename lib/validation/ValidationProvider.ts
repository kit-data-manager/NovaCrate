import { create, StoreApi, UseBoundStore } from "zustand"
import { immer } from "zustand/middleware/immer"
import { createContext, useContext } from "react"
import { EditorState } from "@/lib/state/editor-state"

export type EntityId = string

export interface ValidationResultStore {
    results: ValidationResult[]
    clearResults(entityId?: EntityId, propertyName?: string): void
    clear(): void
    addResults(result: ValidationResult[]): void
}

const store = create<ValidationResultStore>()(
    immer((set) => ({
        results: [],
        clearResults(entityId?: EntityId, propertyName?: string) {
            set((store) => {
                store.results = store.results.filter((result) =>
                    entityId
                        ? propertyName
                            ? result.entityId !== entityId || result.propertyName !== propertyName
                            : result.entityId !== entityId || result.propertyName !== undefined
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

export class ValidationProvider {
    validators: Validator[] = []
    resultStore = store

    constructor(private editorState: UseBoundStore<StoreApi<EditorState>>) {
        // Only one validation provider can be operated at one time
        // clear the store from previous crates
        store.getState().clear()
    }

    addValidator(validator: Validator) {
        this.validators.push(validator)
    }

    async validateCrate() {
        const entities = this.editorState.getState().getEntities()
        const context = this.editorState.getState().crateContext
        const promises: Promise<ValidationResult[]>[] = []
        for (const validator of this.validators) {
            promises.push(
                validator.validateCrate({
                    "@graph": Array.from(entities.values()),
                    "@context": context.context
                })
            )
        }
        const results = await Promise.all(promises)
        store.getState().clearResults()
        store.getState().addResults(results.flat())
    }

    async validateEntity(entityId: string) {
        const entity = this.editorState.getState().getEntities().get(entityId)
        if (!entity) return console.warn("Entity not found during validation", entityId)

        const promises: Promise<ValidationResult[]>[] = []
        for (const validator of this.validators) {
            promises.push(validator.validateEntity(entity))
        }
        const results = await Promise.all(promises)
        store.getState().clearResults(entity["@id"])
        store.getState().addResults(results.flat())
    }

    async validateProperty(entityId: string, propertyName: string) {
        const entity = this.editorState.getState().getEntities().get(entityId)
        if (!entity) return console.warn("Entity not found during validation", entityId)
        const promises: Promise<ValidationResult[]>[] = []
        for (const validator of this.validators) {
            promises.push(validator.validateProperty(entity, propertyName))
        }
        const results = await Promise.all(promises)
        store.getState().clearResults(entity["@id"], propertyName)
        store.getState().addResults(results.flat())
    }
}

export function useValidation() {
    const val = useContext(ValidationContext).validation
    if (!val) throw "ValidationContext is not mounted"
    return val
}

export function useValidationStore() {
    const store = useContext(ValidationContext).validation?.resultStore
    if (!store) throw "ValidationContext is not mounted"
    return store
}

export interface ValidationContext {
    validation: ValidationProvider | undefined
}

export const ValidationContext = createContext<ValidationContext>({ validation: undefined })

export interface Validator {
    name: string
    validateCrate(crate: ICrate): Promise<ValidationResult[]>
    validateEntity(entity: IEntity): Promise<ValidationResult[]>
    validateProperty(entity: IEntity, propertyName: string): Promise<ValidationResult[]>
}

export enum ValidationResultSeverity {
    error = 3,
    warning = 2,
    softWarning = 1,
    info = 0
}

export interface ValidationResult {
    entityId?: string
    propertyName?: string
    propertyIndex?: number

    resultSeverity: ValidationResultSeverity
    resultTitle: string
    resultDescription: string

    actions?: ValidationResultAction[] | ValidationResultActionSerializable[]

    validatorName: string
    profileName?: string
}

export interface ValidationResultAction {
    name: string
    displayName: string
    dispatch: () => void
}

export interface ValidationResultActionSerializable {
    name: string
    displayName: string
    args: unknown[]
}
