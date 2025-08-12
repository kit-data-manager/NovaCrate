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
        private propertyRuleBuilder: RuleBuilder<PropertyRule>
    ) {
        super(context)
    }

    async validateCrate(crate: ICrate): Promise<ValidationResult[]> {
        const crateRules = this.crateRuleBuilder(super.getContext())
        return (await Promise.all(crateRules.map((rule) => rule(crate)))).flat(1)
    }

    async validateProperty(entity: IEntity, propertyName: string): Promise<ValidationResult[]> {
        const propertyRules = this.propertyRuleBuilder(super.getContext())
        return (await Promise.all(propertyRules.map((rule) => rule(entity, propertyName)))).flat(1)
    }

    async validateEntity(entity: IEntity): Promise<ValidationResult[]> {
        const entityRules = this.entityRuleBuilder(super.getContext())
        return (await Promise.all(entityRules.map((rule) => rule(entity)))).flat(1)
    }
}
