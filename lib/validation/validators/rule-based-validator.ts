import { ValidationResult } from "@/lib/validation/validation-result"
import { Validator, ValidatorContext } from "@/lib/validation/validator"

export type RuleBuilder<Rule extends CrateRule | PropertyRule | EntityRule> = (
    ctx: ValidatorContext
) => Rule[]

export type CrateRule = (crate: ICrate) => Promise<ValidationResult[]>
export type EntityRule = (entity: IEntity) => Promise<ValidationResult[]>
export type PropertyRule = (entity: IEntity, propertyName: string) => Promise<ValidationResult[]>

export class RuleBasedValidator extends Validator {
    name = "RuleBasedValidator"

    private crateRules: CrateRule[]
    private entityRules: EntityRule[]
    private propertyRules: PropertyRule[]

    constructor(
        ctx: ValidatorContext,
        crateRuleBuilder: RuleBuilder<CrateRule>,
        entityRuleBuilder: RuleBuilder<EntityRule>,
        propertyRuleBuilder: RuleBuilder<PropertyRule>
    ) {
        super(ctx)

        this.crateRules = crateRuleBuilder(ctx)
        this.entityRules = entityRuleBuilder(ctx)
        this.propertyRules = propertyRuleBuilder(ctx)
    }

    async validateCrate(crate: ICrate): Promise<ValidationResult[]> {
        return (await Promise.all(this.crateRules.map((rule) => rule(crate)))).flat(1)
    }

    async validateProperty(entity: IEntity, propertyName: string): Promise<ValidationResult[]> {
        return (
            await Promise.all(this.propertyRules.map((rule) => rule(entity, propertyName)))
        ).flat(1)
    }

    async validateEntity(entity: IEntity): Promise<ValidationResult[]> {
        return (await Promise.all(this.entityRules.map((rule) => rule(entity)))).flat(1)
    }
}
