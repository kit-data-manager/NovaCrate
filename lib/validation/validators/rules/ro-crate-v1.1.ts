import { CrateRule, RuleBuilder } from "@/lib/validation/validators/rule-based-validator"
import { ValidationResultSeverity } from "@/lib/validation/validation-result"
import { propertyValue, PropertyValueUtils } from "@/lib/property-value-utils"

function findRoot(entities: ICrate["@graph"]) {
    let rootId: string | null = null
    for (const entity of entities) {
        if (
            "conformsTo" in entity &&
            propertyValue(entity.conformsTo).contains("https://w3id.org/ro/crate/")
        ) {
            if ("about" in entity && PropertyValueUtils.isRef(entity.about)) {
                rootId = entity.about["@id"]
                break
            }
        }
    }

    return entities.find((e) => e["@id"] === rootId)
}

export const RoCrateV1_1 = {
    crateRules: ((ctx) => [
        async (crate) => {
            if (!findRoot(crate["@graph"])) {
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
