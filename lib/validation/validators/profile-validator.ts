import {
    ValidationResult,
    ValidationResultSeverity,
    ValidationResultWithoutTrace
} from "../validation-result"
import { Validator, ValidatorContext } from "../validator"
import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"
import { toArray } from "@/lib/utils"
import { propertyValue } from "@/lib/property-value-utils"
import { ProfileClass } from "@/lib/core/profiles/types/ProfileClass"
import { IContextResolverService } from "@/lib/core/IContextResolverService"

// TODO validate against specification that the profile proposes

export class ProfileValidator extends Validator {
    name = "ProfileValidator"

    constructor(
        private profileHandler: IProfileHandler,
        ctx: ValidatorContext
    ) {
        super(ctx)
        this.name = this.name + ` (${profileHandler.name})`
    }

    async validateProperty(): Promise<ValidationResult[]> {
        return []
    }

    async validateEntity(entity: IEntity): Promise<ValidationResultWithoutTrace[]> {
        const def = this.profileHandler.getDefinition()
        if (!def || !this.profileHandler.getIsReady()) return []

        // Determine class rules that match the @type of this entity
        const matchingClassRules = findMatchingClassRules(
            entity,
            def.classes,
            this.getContext().resolver
        )

        // Find all property rules defined on the class rules above
        const propertyRules = def.properties.filter((propertyRule) =>
            propertyRule.domainIncludes.some((d) =>
                matchingClassRules.some((c) => c["@id"] === d["@id"])
            )
        )

        const results: ValidationResultWithoutTrace[] = []

        for (const propertyRule of propertyRules) {
            if (propertyRule.minCount) {
                const count =
                    propertyRule.label in entity ? toArray(entity[propertyRule.label]).length : 0
                if (count < propertyRule.minCount) {
                    results.push({
                        id: crypto.randomUUID(),
                        entityId: entity["@id"],
                        propertyName: count === 0 ? undefined : propertyRule.label,
                        validatorName: this.name,
                        resultTitle:
                            count === 0
                                ? `Property ${propertyRule.label} is required`
                                : `Property ${propertyRule.label} has too few values`,
                        resultDescription: `Property ${propertyRule.label} must have at least ${propertyRule.minCount} value(s)`,
                        resultSeverity: ValidationResultSeverity.error,
                        ruleName: "propertyMinCount"
                    })
                }
            }

            if (propertyRule.maxCount) {
                const count =
                    propertyRule.label in entity ? toArray(entity[propertyRule.label]).length : 0
                if (count > propertyRule.maxCount) {
                    results.push({
                        id: crypto.randomUUID(),
                        entityId: entity["@id"],
                        propertyName: propertyRule.label,
                        validatorName: this.name,
                        resultTitle: `Property ${propertyRule.label} has too many values`,
                        resultDescription: `Property ${propertyRule.label} can have at most ${propertyRule.maxCount} value(s)`,
                        resultSeverity: ValidationResultSeverity.error,
                        ruleName: "propertyMaxCount"
                    })
                }
            }

            if (propertyRule.options && entity[propertyRule.label]) {
                propertyValue(entity[propertyRule.label]).forEach((value, i) => {
                    const valid =
                        propertyRule.options!.find((option) =>
                            typeof value === typeof option
                                ? typeof value === "object"
                                    ? value["@id"] === (option as IReference)["@id"]
                                    : value === option
                                : false
                        ) !== undefined

                    if (!valid) {
                        results.push({
                            id: crypto.randomUUID(),
                            entityId: entity["@id"],
                            propertyName: propertyRule.label,
                            propertyIndex: i,
                            validatorName: this.name,
                            resultTitle: `Property has illegal value`,
                            resultDescription: `Property ${propertyRule.label} must have one of the following values: ${propertyRule.options!.map((option) => JSON.stringify(option)).join(", ")}`,
                            resultSeverity: ValidationResultSeverity.error,
                            ruleName: "propertyOptions"
                        })
                    }
                })
            } else if (propertyRule.rangeIncludes) {
                // TODO range validation
            }
        }

        return results
    }

    async validateCrate(crate: ICrate): Promise<ValidationResultWithoutTrace[]> {
        const def = this.profileHandler.getDefinition()
        if (!def || !this.profileHandler.getIsReady()) return []

        const results: ValidationResultWithoutTrace[] = []

        for (const classRule of def.classes) {
            const classTypesMapped = classRule.specializationOf
                ? classRule.specializationOf.map(
                      (r) => this.getContext().resolver.reverse(r["@id"]) ?? r["@id"]
                  )
                : []

            if (classRule.minCount || classRule.maxCount) {
                const count = crate["@graph"].filter((e) =>
                    classTypesMapped.every((type) => toArray(e["@type"]).includes(type))
                ).length

                if (classRule.minCount && count < classRule.minCount) {
                    results.push({
                        id: crypto.randomUUID(),
                        validatorName: this.name,
                        resultTitle:
                            count === 0
                                ? `${classRuleDisplayName(classRule)} entity is required`
                                : `Too few ${classRuleDisplayName(classRule)} entities`,
                        resultDescription: `There must be at least ${classRule.minCount} ${classRuleDisplayName(classRule)} entities of type ${classRule.specializationOf ? "[" + classRule.specializationOf.map((r) => this.getContext().resolver.reverse(r["@id"]) ?? r["@id"]).join(", ") + "]" : "[]"} in this RO-Crate.`,
                        resultSeverity: ValidationResultSeverity.error,
                        ruleName: "classMinCount"
                    })
                }

                if (classRule.maxCount && count > classRule.maxCount) {
                    results.push({
                        id: crypto.randomUUID(),
                        validatorName: this.name,
                        resultTitle: `Too many ${classRuleDisplayName(classRule)} entities`,
                        resultDescription: `There can be at most ${classRule.maxCount} ${classRuleDisplayName(classRule)} entities of type ${classRule.specializationOf ? "[" + classRule.specializationOf.map((r) => this.getContext().resolver.reverse(r["@id"]) ?? r["@id"]).join(", ") + "]" : "[]"} in this RO-Crate.`,
                        resultSeverity: ValidationResultSeverity.error,
                        ruleName: "classMaxCount"
                    })
                }
            }
        }

        return results
    }
}

function classRuleDisplayName(rule: ProfileClass) {
    return rule.label || rule.name || rule["@id"]
}

function findMatchingClassRules(
    entity: IEntity,
    classRules: ProfileClass[],
    resolver: IContextResolverService
) {
    return classRules.filter((c) =>
        c.specializationOf
            ? c.specializationOf
                  // We reverse the term URI relative to our context as the incoming entity also uses shorthand terms. This approach is imune to https:// vs http:// difficulties
                  .map((s) => resolver.reverse(s["@id"]) ?? s["@id"])
                  .every((t) => toArray(entity["@type"]).includes(t))
            : false
    )
}
