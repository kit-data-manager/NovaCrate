import { editorState } from "@/lib/state/editor-state"
import { ValidationResultSeverity } from "@/lib/validation/validation-result"
import {
    EntityRule,
    PropertyRule,
    RuleBasedValidator,
    RuleBuilder
} from "@/lib/validation/validators/rule-based-validator"
import { ValidatorContext } from "@/lib/validation/validator"

const entityRules: RuleBuilder<EntityRule> = (ctx) => [
    async (entity) => {
        if (
            entity["@id"] === ctx.editorState.getState().getRootEntityId() &&
            !("license" in entity)
        ) {
            return [
                {
                    entityId: entity["@id"],
                    validatorName: "SpecificationValidator",
                    resultTitle: "Missing license",
                    resultDescription: "The root entity of a crate should have a license",
                    resultSeverity: ValidationResultSeverity.warning,
                    ruleName: "missingLicense",
                    actions: [
                        {
                            name: "addLicense",
                            displayName: "Add license",
                            dispatch() {
                                editorState.getState().addProperty(entity["@id"], "license", [""])
                            }
                        }
                    ]
                }
            ]
        } else return []
    }
]

const propertyRules: RuleBuilder<PropertyRule> = (ctx) => [
    async (entity, propertyName) => {
        if (
            entity["@id"] === ctx.editorState.getState().getRootEntityId() &&
            propertyName === "license" &&
            entity[propertyName] !== undefined
        ) {
            if (
                Array.isArray(entity[propertyName])
                    ? entity[propertyName].filter((s) => s).length === 0
                    : typeof entity[propertyName] === "string"
                      ? entity[propertyName] === ""
                      : entity[propertyName]["@id"] === ""
            )
                return [
                    {
                        entityId: entity["@id"],
                        propertyName,
                        validatorName: "SpecificationValidator",
                        resultTitle: "Empty license property",
                        resultDescription:
                            "The root entity of a crate should have a license, but  the license field is empty",
                        resultSeverity: ValidationResultSeverity.warning,
                        ruleName: "missingLicense",
                        actions: [
                            {
                                name: "useCC0License",
                                displayName: "Use CC0 License",
                                dispatch() {
                                    editorState
                                        .getState()
                                        .setPropertyValue(
                                            entity["@id"],
                                            "license",
                                            "https://creativecommons.org/publicdomain/zero/1.0/legalcode",
                                            0
                                        )
                                }
                            }
                        ]
                    }
                ]
            return []
        } else return []
    }
]

export function makeSpecificationValidator() {
    return (ctx: ValidatorContext) =>
        new RuleBasedValidator(ctx, () => [], entityRules, propertyRules)
}
