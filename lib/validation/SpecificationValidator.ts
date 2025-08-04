import {
    ValidationResult,
    ValidationResultSeverity,
    Validator
} from "@/lib/validation/ValidationProvider"
import { isRootEntity } from "@/lib/utils"
import { editorState } from "@/lib/state/editor-state"

const entityRules: EntityRule[] = [
    async (entity) => {
        if (isRootEntity(entity) && !("license" in entity)) {
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

const propertyRules: PropertyRule[] = [
    async (entity, propertyName) => {
        if (
            isRootEntity(entity) &&
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

type CrateRule = (crate: ICrate) => Promise<ValidationResult[]>
type PropertyRule = (entity: IEntity, propertyName: string) => Promise<ValidationResult[]>
type EntityRule = (entity: IEntity) => Promise<ValidationResult[]>

export class SpecificationValidator implements Validator {
    name = "SpecificationValidator"

    async validateCrate(crate: ICrate): Promise<ValidationResult[]> {
        return []
    }

    async validateProperty(entity: IEntity, propertyName: string): Promise<ValidationResult[]> {
        return (await Promise.all(propertyRules.map((rule) => rule(entity, propertyName)))).flat(1)
    }

    async validateEntity(entity: IEntity): Promise<ValidationResult[]> {
        return (await Promise.all(entityRules.map((rule) => rule(entity)))).flat(1)
    }
}
