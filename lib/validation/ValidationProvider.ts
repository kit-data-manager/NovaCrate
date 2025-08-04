import { create, StoreApi, UseBoundStore } from "zustand"
import { immer } from "zustand/middleware/immer"
import { createContext, useContext } from "react"
import { EditorState } from "@/lib/state/editor-state"

export type EntityId = string

export interface ValidationResultStore {
    results: ValidationResult[]
    clearResults(entityId?: EntityId, propertyName?: string): void
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
                        : false
                )
            })
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

    constructor(private editorState: UseBoundStore<StoreApi<EditorState>>) {}

    addValidator(validator: Validator) {
        this.validators.push(validator)
    }

    validateEntity(entityId: string) {
        const entity = this.editorState.getState().getEntities().get(entityId)
        // TODO: handle undefined entity
        if (!entity) return
        store.getState().clearResults(entity["@id"])
        const results: ValidationResult[] = []
        for (const validator of this.validators) {
            results.push(...validator.validateEntity(entity))
        }
        store.getState().addResults(results)
    }

    validateProperty(entityId: string, propertyName: string) {
        const entity = this.editorState.getState().getEntities().get(entityId)
        // TODO: handle undefined entity
        if (!entity) return console.log("Entity not found", entityId)
        store.getState().clearResults(entity["@id"], propertyName)
        const results: ValidationResult[] = []
        for (const validator of this.validators) {
            results.push(...validator.validateProperty(entity, propertyName))
        }
        store.getState().addResults(results)
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
    validateCrate(crate: ICrate): ValidationResult[]
    validateEntity(entity: IEntity): ValidationResult[]
    validateProperty(entity: IEntity, propertyName: string): ValidationResult[]
}

export type ValidationResultType = "error" | "warning" | "soft-warning" | "info"

export interface ValidationResult {
    entityId?: string
    propertyName?: string
    propertyIndex?: number

    resultType: ValidationResultType
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
