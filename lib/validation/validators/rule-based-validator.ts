import { ValidationResult } from "@/lib/validation/validation-result"
import { Validator, ValidatorContext } from "@/lib/validation/validator"

export type RuleBuilder<Rule extends CrateRule | PropertyRule | EntityRule> = (
    ctx: ValidatorContext
) => Rule[]

export type CrateValidationResult = Omit<
    ValidationResult,
    "propertyName" | "propertyIndex" | "entityId"
>
export type EntityValidationResult = Omit<ValidationResult, "propertyName" | "propertyIndex"> & {
    entityId: string
}
export type PropertyValidationResult = ValidationResult & { entityId: string; propertyName: string }

export type CrateRule = (crate: ICrate) => Promise<CrateValidationResult[]>
export type EntityRule = (entity: IEntity) => Promise<EntityValidationResult[]>
export type PropertyRule = (
    entity: IEntity,
    propertyName: string
) => Promise<PropertyValidationResult[]>

export class RuleBasedValidator extends Validator {
    name = "RuleBasedValidator"

    constructor(
        context: ValidatorContext,
        private crateRuleBuilder: RuleBuilder<CrateRule>,
        private entityRuleBuilder: RuleBuilder<EntityRule>,
        private propertyRuleBuilder: RuleBuilder<PropertyRule>,
        // Hook to prevent running the validator depending on the context. Useful, for example, to prevent running the validator on the wrong spec.
        private preflightHook?: (ctx: ValidatorContext) => boolean
    ) {
        super(context)
    }

    async validateCrate(crate: ICrate): Promise<ValidationResult[]> {
        if (this.preflightHook && !this.preflightHook(super.getContext())) return []

        const crateRules = this.crateRuleBuilder(super.getContext())
        const results = await Promise.allSettled(crateRules.map((rule) => rule(crate)))
        return results
            .filter((result): result is PromiseFulfilledResult<CrateValidationResult[]> => {
                if (result.status === "rejected") {
                    console.error(`[${this.name}] Crate rule failed:`, result.reason)
                    return false
                }
                return true
            })
            .map((result) => result.value)
            .flat(1)
    }

    async validateProperty(entity: IEntity, propertyName: string): Promise<ValidationResult[]> {
        if (this.preflightHook && !this.preflightHook(super.getContext())) return []

        const crateRules = this.propertyRuleBuilder(super.getContext())
        const results = await Promise.allSettled(
            crateRules.map((rule) => rule(entity, propertyName))
        )
        return results
            .filter((result): result is PromiseFulfilledResult<PropertyValidationResult[]> => {
                if (result.status === "rejected") {
                    console.error(`[${this.name}] Property rule failed:`, result.reason)
                    return false
                }
                return true
            })
            .map((result) => result.value)
            .flat(1)
    }

    async validateEntity(entity: IEntity): Promise<ValidationResult[]> {
        if (this.preflightHook && !this.preflightHook(super.getContext())) return []

        const entityRules = this.entityRuleBuilder(super.getContext())
        const results = await Promise.allSettled(entityRules.map((rule) => rule(entity)))
        return results
            .filter((result): result is PromiseFulfilledResult<EntityValidationResult[]> => {
                if (result.status === "rejected") {
                    console.error(`[${this.name}] Entity rule failed:`, result.reason)
                    return false
                }
                return true
            })
            .map((result) => result.value)
            .flat(1)
    }
}
