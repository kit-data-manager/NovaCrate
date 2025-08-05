import { StoreApi, UseBoundStore } from "zustand"
import { EditorState } from "@/lib/state/editor-state"
import { createValidationResultStore } from "@/lib/state/validation-result-store"
import { Validator, ValidatorContext } from "@/lib/validation/validator"
import { ValidationResult } from "@/lib/validation/validation-result"

export class ValidationProvider {
    validators: Validator[] = []
    resultStore = createValidationResultStore()
    editorState: UseBoundStore<StoreApi<EditorState>>

    constructor(private validatorContext: ValidatorContext) {
        this.editorState = validatorContext.editorState
    }

    addValidator(validatorConstructor: (validatorContext: ValidatorContext) => Validator) {
        this.validators.push(validatorConstructor(this.validatorContext))
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
        this.resultStore.getState().clearResults()
        this.resultStore.getState().addResults(results.flat())
    }

    async validateEntity(entityId: string) {
        const entity = this.editorState.getState().getEntities().get(entityId)
        if (!entity) return console.warn("Entity not found during validation", entityId)

        const promises: Promise<ValidationResult[]>[] = []
        for (const validator of this.validators) {
            promises.push(validator.validateEntity(entity))
        }
        const results = await Promise.all(promises)
        this.resultStore.getState().clearResults(entity["@id"])
        this.resultStore.getState().addResults(results.flat())
    }

    async validateProperty(entityId: string, propertyName: string) {
        const entity = this.editorState.getState().getEntities().get(entityId)
        if (!entity) return console.warn("Entity not found during validation", entityId)
        const promises: Promise<ValidationResult[]>[] = []
        for (const validator of this.validators) {
            promises.push(validator.validateProperty(entity, propertyName))
        }
        const results = await Promise.all(promises)
        this.resultStore.getState().clearResults(entity["@id"], propertyName)
        this.resultStore.getState().addResults(results.flat())
    }
}
