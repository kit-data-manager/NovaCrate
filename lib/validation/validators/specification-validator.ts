import { RuleBasedValidator } from "@/lib/validation/validators/rule-based-validator"
import { ValidatorContext } from "@/lib/validation/validator"
import { RoCrateV1_1 } from "@/lib/validation/validators/rules/ro-crate-v1.1"

export function makeSpecificationValidator() {
    return (ctx: ValidatorContext) =>
        new RuleBasedValidator(ctx, RoCrateV1_1.crateRules, RoCrateV1_1.entityRules, () => [])
}
