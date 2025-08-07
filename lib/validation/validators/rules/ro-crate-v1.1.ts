import { CrateRule, RuleBuilder } from "@/lib/validation/validators/rule-based-validator"
import { ValidationResultSeverity } from "@/lib/validation/validation-result"

function findRoot(crate: ICrate) {
    let rootId: string | null = null
    for (const entity of crate["@graph"]) {
        if ("conformsTo" in entity) {
            if (
                typeof entity.conformsTo === "object" &&
                !Array.isArray(entity.conformsTo) &&
                entity.conformsTo["@id"] === "https://w3id.org/ro/crate/"
            ) {
                if (typeof entity.about === "object" && !Array.isArray(entity.about))
                    rootId = entity.about["@id"]
            }
        }
    }

    return crate["@graph"].find((e) => e["@id"] === rootId)
}

export const RoCrateV1_1 = {
    crateRules: ((ctx) => [
        async (crate) => {
            if (!findRoot(crate)) {
                return [
                    {
                        validatorName: "RoCrateV1_1",
                        resultTitle: "Missing root entity",
                        resultDescription: "The crate should have a root entity",
                        resultSeverity: ValidationResultSeverity.error,
                        ruleName: "missingRootEntity"
                    }
                ]
            } else return []
        }
    ]) satisfies RuleBuilder<CrateRule>
}
