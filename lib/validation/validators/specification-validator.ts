import { RuleBasedValidator } from "@/lib/validation/validators/rule-based-validator"
import { ValidatorContext } from "@/lib/validation/validator"
import { RoCrateV1_1 } from "@/lib/validation/validators/rules/ro-crate-v1.1"
import { RO_CRATE_VERSION } from "@/lib/constants"
import { RoCrateV1_2 } from "@/lib/validation/validators/rules/ro-crate-v1.2"
import { RoCrateBase } from "@/lib/validation/validators/rules/ro-crate-base"

export function makeSpecificationValidators() {
    return [
        (ctx: ValidatorContext) =>
            new RuleBasedValidator(
                ctx,
                RoCrateV1_1.crateRules,
                RoCrateV1_1.entityRules,
                RoCrateV1_1.propertyRules,
                (ctx) => ctx.editorState.crateContext.specification === RO_CRATE_VERSION.V1_1_3
            ),
        (ctx: ValidatorContext) =>
            new RuleBasedValidator(
                ctx,
                RoCrateV1_2.crateRules,
                RoCrateV1_2.entityRules,
                RoCrateV1_2.propertyRules,
                (ctx) => ctx.editorState.crateContext.specification === RO_CRATE_VERSION.V1_2_0
            )
    ]
}

export function makeBaseValidator() {
    return (ctx: ValidatorContext) =>
        new RuleBasedValidator(ctx, () => [], RoCrateBase.entityRules, RoCrateBase.propertyRules)
}
