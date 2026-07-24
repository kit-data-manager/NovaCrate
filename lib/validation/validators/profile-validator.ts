import { ValidationResultWithoutTrace } from "../validation-result"
import { Validator } from "../validator"
import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"
import { isValidUrl, toArray } from "@/lib/utils"
import { ValidationResultBuilder } from "@/lib/validation/validation-result-builder"
import { ProfileClass } from "@/lib/core/profiles/types/ProfileClass"
import { editorState } from "@/lib/state/editor-state"
import { propertyValue } from "@/lib/property-value-utils"
import { PropertyType } from "@/lib/property"
import { ProfileProperty } from "@/lib/core/profiles/types/ProfileProperty"
import { ProfilePropertyValue } from "@/lib/core/profiles/types/ProfilePropertyValue"

export class ProfileValidator extends Validator {
    name = "ProfileValidator"
    resultBuilder: ValidationResultBuilder

    constructor(
        private profileHandler: IProfileHandler,
        ctx: ConstructorParameters<typeof Validator>[0]
    ) {
        super(ctx)
        this.name = this.name + ` (${profileHandler.name})`
        this.resultBuilder = new ValidationResultBuilder(this.name)
    }

    async validateProperty(): Promise<ValidationResultWithoutTrace[]> {
        return []
    }

    async validateEntity(entity: IEntity): Promise<ValidationResultWithoutTrace[]> {
        if (!this.profileHandler.getIsReady()) return []

        const results: ValidationResultWithoutTrace[] = []
        const mapping = this.profileHandler.getEntityMapping()
        const classRuleId = mapping.get(entity["@id"])
        if (!classRuleId) return []
        const classRule = this.profileHandler.getClassRule(classRuleId)
        if (!classRule) return []

        this.validateEntityType(entity, classRule, results)
        this.validateAllEntityProperties(classRuleId, entity, results)

        return results
    }

    private validateAllEntityProperties(
        classRuleId: string,
        entity: IEntity,
        results: ValidationResultWithoutTrace[]
    ) {
        const propertyRules = this.profileHandler.getPropertiesOnClass(classRuleId)

        for (const propertyRule of propertyRules) {
            let propertyCount = 0
            if (propertyRule.label in entity) {
                const property = entity[propertyRule.label]

                propertyCount = toArray(property).length

                if (propertyRule.options) {
                    this.validatePropertyOptions(property, propertyRule, results, entity)
                } else if (propertyRule.rangeIncludes) {
                    this.validatePropertyRange(property, propertyRule, results, entity)
                }
            }

            this.validatePropertyCount(propertyRule, propertyCount, results, entity)
        }
    }

    private validateEntityType(
        entity: IEntity,
        classRule: ProfileClass,
        results: ValidationResultWithoutTrace[]
    ) {
        const missingTypes = this.classRuleFindMissingTypes(entity, classRule)
        if (missingTypes.length > 0) {
            results.push(
                this.resultBuilder.rule("entityTypeMismatch").error({
                    resultTitle: "The type of this entity does not match its profile",
                    propertyName: "@type",
                    entityId: entity["@id"],
                    resultDescription: `This entity is a \`${classRuleName(classRule)}\` entity, but its type does not match. The following types are missing: ${missingTypes.map((t) => "`" + t + "`").join(", ")}`,
                    actions: [
                        this.resultBuilder.action("fix", "Fix", () => {
                            for (const missingType of missingTypes) {
                                editorState
                                    .getState()
                                    .addPropertyEntry(entity["@id"], "@type", missingType)
                            }
                        })
                    ]
                })
            )
        }
    }

    private validatePropertyCount(
        propertyRule: ProfileProperty,
        propertyCount: number,
        results: ValidationResultWithoutTrace[],
        entity: IEntity
    ) {
        if (propertyRule.minCount !== undefined && propertyCount < propertyRule.minCount) {
            if (propertyRule.minCount === 1) {
                results.push(
                    this.resultBuilder.rule("missingMandatoryProperty").error({
                        resultTitle: `Missing \`${propertyRule.label}\` property`,
                        resultDescription: `The mandatory property \`${propertyRule.label}\` is missing from this entity`,
                        entityId: entity["@id"],
                        actions: [
                            this.resultBuilder.action("add-property", "Add Property", () => {
                                editorState
                                    .getState()
                                    .addPropertyEntry(
                                        entity["@id"],
                                        propertyRule.label,
                                        PropertyType.Text
                                    )
                            })
                        ]
                    })
                )
            } else {
                results.push(
                    this.resultBuilder.rule("tooFewMandatoryProperties").error({
                        resultTitle: `Property \`${propertyRule.label}\` too few entries`,
                        resultDescription: `The mandatory property \`${propertyRule.label}\` must be present at least ${propertyRule.minCount} times`,
                        entityId: entity["@id"],
                        actions: [
                            this.resultBuilder.action("add-property", "Add Properties", () => {
                                for (let i = propertyCount; i < (propertyRule.minCount ?? 0); i++) {
                                    editorState
                                        .getState()
                                        .addPropertyEntry(
                                            entity["@id"],
                                            propertyRule.label,
                                            PropertyType.Text
                                        )
                                }
                            })
                        ]
                    })
                )
            }
        }

        if (propertyRule.maxCount !== undefined && propertyCount > propertyRule.maxCount) {
            results.push(
                this.resultBuilder.rule("tooManyPropertyEntries").error({
                    resultTitle: `Property \`${propertyRule.label}\` has too many entries`,
                    resultDescription: `The property \`${propertyRule.label}\` must not be present more than ${propertyRule.maxCount} times`,
                    entityId: entity["@id"],
                    propertyName: propertyRule.label,
                    propertyIndex: 0
                })
            )
        }
    }

    private validatePropertyRange(
        property: string | IReference | (string | IReference)[],
        propertyRule: ProfileProperty,
        results: ValidationResultWithoutTrace[],
        entity: IEntity
    ) {
        if (!propertyRule.rangeIncludes) return

        const classRules: ProfileClass[] = []
        const propertyValueRules: ProfilePropertyValue[] = []
        const types: string[] = []

        // Classify each entry into one of the categories above. Types is the fallback category
        for (const entry of propertyRule.rangeIncludes) {
            const _classRule = this.profileHandler.getClassRule(entry["@id"])
            if (_classRule) classRules.push(_classRule)
            else {
                const _propertyValueRule = this.profileHandler.getPropertyValueRule(entry["@id"])
                if (_propertyValueRule) propertyValueRules.push(_propertyValueRule)
                else types.push(entry["@id"])
            }
        }

        for (const propertyValueRule of propertyValueRules) {
            const matchingIndices: number[] = []
            propertyValue(property).forEach((value, i) => {
                let match = false
                if (typeof propertyValueRule.value === "object" && typeof value === "object") {
                    if (propertyValueRule.value["@id"] === value["@id"]) match = true
                } else if (
                    typeof propertyValueRule.value === "string" &&
                    typeof value === "string"
                ) {
                    if (propertyValueRule.value === value) match = true
                }

                if (match) {
                    matchingIndices.push(i)
                }
            })

            const matches = matchingIndices.length

            if (propertyValueRule.minCount !== undefined && matches < propertyValueRule.minCount) {
                if (propertyValueRule.minCount === 1) {
                    results.push(
                        this.resultBuilder.rule("missingMandatoryPropertyValue").error({
                            resultTitle: "Missing mandatory value",
                            resultDescription: `This property must contain ${typeof propertyValueRule.value === "object" ? "a reference to `" + propertyValueRule.value + "`" : "the value `" + propertyValueRule.value + "`"}`,
                            entityId: entity["@id"],
                            propertyName: propertyRule.label,
                            actions: [
                                this.resultBuilder.action("add-missing", "Add Value", () => {
                                    editorState
                                        .getState()
                                        .addPropertyEntry(
                                            entity["@id"],
                                            propertyRule.label,
                                            propertyValueRule.value
                                        )
                                })
                            ]
                        })
                    )
                } else {
                    results.push(
                        this.resultBuilder.rule("tooFewMandatoryPropertyValues").error({
                            resultTitle: "Too few mandatory values",
                            resultDescription: `This property must contain ${typeof propertyValueRule.value === "object" ? "a reference to `" + propertyValueRule.value + "`" : "the value `" + propertyValueRule.value + "`"} at least ${propertyValueRule.minCount} times`,
                            entityId: entity["@id"],
                            propertyName: propertyRule.label,
                            actions: [
                                this.resultBuilder.action("add-missing", "Add Values", () => {
                                    for (
                                        let i = matches;
                                        i < (propertyValueRule.minCount ?? 0);
                                        i++
                                    ) {
                                        editorState
                                            .getState()
                                            .addPropertyEntry(
                                                entity["@id"],
                                                propertyRule.label,
                                                propertyValueRule.value
                                            )
                                    }
                                })
                            ]
                        })
                    )
                }

                if (
                    propertyValueRule.maxCount !== undefined &&
                    matches > propertyValueRule.maxCount
                ) {
                    for (const i of matchingIndices) {
                        results.push(
                            this.resultBuilder.rule("tooManyPropertyValues").error({
                                resultTitle: "Too many values",
                                resultDescription: `This property must contain ${typeof propertyValueRule.value === "object" ? "a reference to `" + propertyValueRule.value + "`" : "the value `" + propertyValueRule.value + "`"} no more than ${propertyValueRule.maxCount} times`,
                                entityId: entity["@id"],
                                propertyName: propertyRule.label,
                                propertyIndex: i,
                                actions: [
                                    this.resultBuilder.action("remove", "Remove Value", () => {
                                        editorState
                                            .getState()
                                            .removePropertyEntry(
                                                entity["@id"],
                                                propertyRule.label,
                                                i
                                            )
                                    })
                                ]
                            })
                        )
                    }
                }
            }
        }
    }

    private validatePropertyOptions(
        property: string | IReference | (string | IReference)[],
        propertyRule: ProfileProperty,
        results: ValidationResultWithoutTrace[],
        entity: IEntity
    ) {
        const invalidIndices: number[] = []
        propertyValue(property).forEach((value, i) => {
            const equiv = propertyRule.options!.find((option) => {
                if (typeof value === "object" && typeof option === "object") {
                    return value["@id"] === option["@id"]
                } else if (typeof value === "string" && typeof option === "string") {
                    return value === option
                } else {
                    return false
                }
            })
            if (equiv === undefined) {
                invalidIndices.push(i)
            }
        })

        if (invalidIndices.length > 0) {
            for (const i of invalidIndices) {
                results.push(
                    this.resultBuilder.rule("invalidPropertyOption").error({
                        resultTitle: "Invalid value",
                        resultDescription: `The value of this property is not allowed under the ${this.profileHandler.getDefinition()!.name} profile. Possible options are: ${propertyRule.options!.map((o) => (typeof o === "object" ? "Reference to `" + o["@id"] + "`" : "`" + o + "`")).join(", ")}`,
                        entityId: entity["@id"],
                        propertyName: propertyRule.label,
                        propertyIndex: i
                    })
                )
            }
        }
    }

    private classRuleFindMissingTypes(entity: IEntity, classRule: ProfileClass) {
        const entityTypes = toArray(entity["@type"]).map((type) =>
            isValidUrl(type) ? type : (this.getContext().resolver.resolve(type) ?? type)
        )
        return (
            classRule.specializationOf ? classRule.specializationOf.map((s) => s["@id"]) : []
        ).filter((t) => !entityTypes.includes(t))
    }

    async validateCrate(crate: ICrate): Promise<ValidationResultWithoutTrace[]> {
        const def = this.profileHandler.getDefinition()
        if (!def || !this.profileHandler.getIsReady()) return []

        const results: ValidationResultWithoutTrace[] = []
        const mapping = this.profileHandler.getEntityMapping()

        const classCounts: Record<string, number> = {}
        for (const classRuleId of mapping.values()) {
            classCounts[classRuleId] = (classCounts[classRuleId] ?? 0) + 1
        }

        for (const classRule of def.classes) {
            const classCount = classCounts[classRule["@id"]] ?? 0

            if (classRule.minCount !== undefined && classCount < classRule.minCount) {
                if (classRule.minCount === 1) {
                    results.push(
                        this.resultBuilder.rule("missingMandatoryEntity").error({
                            resultTitle: `Missing \`${classRuleName(classRule)}\` entity`,
                            resultDescription: `The mandatory entity \`${classRuleName(classRule)}\` is missing from this RO-Crate`
                        })
                    )
                } else {
                    results.push(
                        this.resultBuilder.rule("missingMandatoryEntity").error({
                            resultTitle: `Too few \`${classRuleName(classRule)}\` entities`,
                            resultDescription: `The mandatory entity \`${classRuleName(classRule)}\` must be present at least ${classRule.minCount} times`
                        })
                    )
                }
            }

            if (classRule.maxCount !== undefined && classCount > classRule.maxCount) {
                results.push(
                    this.resultBuilder.rule("tooManyEntities").error({
                        resultTitle: `Too many \`${classRuleName(classRule)}\` entities`,
                        resultDescription: `The entity \`${classRuleName(classRule)}\` must not be present more than ${classRule.maxCount} times`
                    })
                )
            }
        }

        return results
    }
}

function classRuleName(c: ProfileClass) {
    return c.name || c.label || c["@id"]
}
