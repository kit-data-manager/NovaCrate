import { RuleBasedValidator } from "@/lib/validation/validators/rule-based-validator"
import { ValidatorContext } from "@/lib/validation/validator"
import { RoCrateV1_1 } from "@/lib/validation/validators/rules/ro-crate-v1.1"
import { RO_CRATE_VERSION } from "@/lib/constants"
import { RoCrateBase } from "@/lib/validation/validators/rules/ro-crate-base"
import { ValidationResultBuilder } from "@/lib/validation/validation-result-builder"
import { buildRoCrateV1_2Rules } from "@/lib/validation/validators/rules/ro-crate-v1.2"

// v1.3.0 has no significant changes compared to v1.2.0, so we can reuse the v1.2 rules
const RoCrateV1_2 = buildRoCrateV1_2Rules(new ValidationResultBuilder("spec-v1.2"))
const RoCrateV1_3 = buildRoCrateV1_2Rules(new ValidationResultBuilder("spec-v1.3"))

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
            ),
        (ctx: ValidatorContext) =>
            new RuleBasedValidator(
                ctx,
                RoCrateV1_3.crateRules,
                RoCrateV1_3.entityRules,
                RoCrateV1_3.propertyRules,
                (ctx) => ctx.editorState.crateContext.specification === RO_CRATE_VERSION.V1_3_0
            )
    ]
}

export function makeBaseValidator() {
    return (ctx: ValidatorContext) =>
        new RuleBasedValidator(
            ctx,
            RoCrateBase.crateRules,
            RoCrateBase.entityRules,
            RoCrateBase.propertyRules
        )
}
