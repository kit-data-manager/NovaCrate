import { EditorState } from "@/lib/state/editor-state"
import { createValidationResultStore } from "@/lib/state/validation-result-store"
import { Validator, ValidatorContext } from "@/lib/validation/validator"
import { ValidationResult } from "@/lib/validation/validation-result"

export class ValidationProvider {
    validators: Validator[] = []
    resultStore = createValidationResultStore()
    editorState: EditorState

    constructor(private validatorContext: ValidatorContext) {
        this.editorState = validatorContext.editorState
    }

    addValidator(validatorConstructor: (validatorContext: ValidatorContext) => Validator) {
        this.validators.push(validatorConstructor(this.validatorContext))
    }

    updateContext(ctx: ValidatorContext) {
        this.validatorContext = ctx
        for (const validator of this.validators) {
            validator.updateContext(ctx)
        }
    }

    async validateCrate() {
        const entities = this.editorState.getEntities()
        const context = this.editorState.crateContext
        const promises: Promise<ValidationResult[]>[] = []
        for (const validator of this.validators) {
            promises.push(
                validator.validateCrate({
                    "@graph": Array.from(entities.values()),
                    "@context": context.context
                })
            )
        }

        const results = await this.handlePromises(promises)
        this.resultStore.getState().clearResults()
        this.resultStore.getState().addResults(results)
    }

    async validateEntity(entityId: string) {
        const entity = this.editorState.getEntities().get(entityId)
        if (!entity) return console.warn("Entity not found during validation", entityId)

        const promises: Promise<ValidationResult[]>[] = []
        for (const validator of this.validators) {
            promises.push(validator.validateEntity(entity))
        }

        const results = await this.handlePromises(promises)
        this.resultStore.getState().clearResults(entity["@id"])
        this.resultStore.getState().addResults(results)
    }

    async validateProperty(entityId: string, propertyName: string) {
        const entity = this.editorState.getEntities().get(entityId)
        if (!entity) return console.warn("Entity not found during validation", entityId)
        const promises: Promise<ValidationResult[]>[] = []
        for (const validator of this.validators) {
            promises.push(validator.validateProperty(entity, propertyName))
        }

        const results = await this.handlePromises(promises)
        this.resultStore.getState().clearResults(entity["@id"], propertyName)
        this.resultStore.getState().addResults(results)
    }

    private async handlePromises(
        promises: Promise<ValidationResult[]>[]
    ): Promise<ValidationResult[]> {
        const settledResults = await Promise.allSettled(promises)
        const results: ValidationResult[] = []

        settledResults.forEach((result, index) => {
            if (result.status === "fulfilled") {
                results.push(...result.value)
            } else {
                console.error(
                    `Validator ${this.validators[index].constructor.name} failed during crate validation:`,
                    result.reason
                )
            }
        })

        return results
    }
}
