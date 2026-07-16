import { ValidationResultSeverity, ValidationResultWithoutTrace } from "../validation-result"
import { Validator } from "../validator"
import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"
import { ProfileClass } from "@/lib/core/profiles/types/ProfileClass"
import { ProfileProperty } from "@/lib/core/profiles/types/ProfileProperty"
import { toArray } from "@/lib/utils"
import { propertyValue, PropertyValueUtils } from "@/lib/property-value-utils"

export class ProfileValidator extends Validator {
    name = "ProfileValidator"

    constructor(
        private profileHandler: IProfileHandler,
        ctx: ConstructorParameters<typeof Validator>[0]
    ) {
        super(ctx)
        this.name = this.name + ` (${profileHandler.name})`
    }

    async validateProperty(): Promise<ValidationResultWithoutTrace[]> {
        return []
    }

    async validateEntity(): Promise<ValidationResultWithoutTrace[]> {
        return []
    }

    async validateCrate(crate: ICrate): Promise<ValidationResultWithoutTrace[]> {
        const def = this.profileHandler.getDefinition()
        if (!def || !this.profileHandler.getIsReady()) return []

        const classRuleMapping = new Map<string, string>()
        const done = new Set<string>()
        const queue: string[] = []
        const validationOutput: ValidationResultWithoutTrace[] = []

        const metadataDescriptorClassRule = this.findClassRuleWithMetadataDescriptorProperty(def)
        if (!metadataDescriptorClassRule) {
            validationOutput.push(
                this.createCrateError({
                    resultTitle: "Missing metadata descriptor property rule",
                    resultDescription:
                        "The profile does not define a property rule with label '@id' and options ['ro-crate-metadata.json'] to identify the metadata descriptor."
                })
            )
            return validationOutput
        }

        const metadataDescriptorEntity = crate["@graph"].find(
            (e) => e["@id"] === "ro-crate-metadata.json"
        )
        if (!metadataDescriptorEntity) {
            validationOutput.push(
                this.createCrateError({
                    resultTitle: "Missing metadata descriptor entity",
                    resultDescription:
                        "The crate must have a metadata descriptor entity with @id 'ro-crate-metadata.json'."
                })
            )
            return validationOutput
        }

        classRuleMapping.set(metadataDescriptorEntity["@id"], metadataDescriptorClassRule["@id"])

        const aboutPropertyRule = this.findPropertyRuleForLabel(
            def,
            metadataDescriptorClassRule["@id"],
            "about"
        )
        if (!aboutPropertyRule) {
            validationOutput.push(
                this.createCrateError({
                    resultTitle: "Missing 'about' property rule on metadata descriptor",
                    resultDescription:
                        "The profile does not define a property rule with label 'about' on the metadata descriptor class rule."
                })
            )
            return validationOutput
        }

        const aboutValue = metadataDescriptorEntity["about"]
        if (
            !aboutValue ||
            !propertyValue(aboutValue).hasRefs() ||
            propertyValue(aboutValue).isEmpty()
        ) {
            validationOutput.push(
                this.createCrateError({
                    resultTitle: "Missing 'about' property on metadata descriptor",
                    resultDescription:
                        "The metadata descriptor must have an 'about' property referencing the root entity."
                })
            )
            return validationOutput
        }

        let rootEntityId: string | undefined
        propertyValue(aboutValue).forEach((v) => {
            if (PropertyValueUtils.isRef(v) && !rootEntityId) {
                rootEntityId = v["@id"]
            }
        })
        if (!rootEntityId) {
            validationOutput.push(
                this.createCrateError({
                    resultTitle: "Missing root entity reference",
                    resultDescription:
                        "The 'about' property of the metadata descriptor must reference a valid entity."
                })
            )
            return validationOutput
        }

        const rootEntityClassRuleId = this.findClassRuleIdByRange(
            def,
            aboutPropertyRule.rangeIncludes
        )
        if (!rootEntityClassRuleId) {
            validationOutput.push(
                this.createCrateError({
                    resultTitle: "Missing root entity class rule",
                    resultDescription:
                        "The 'about' property rule must have a rangeIncludes referencing a class rule."
                })
            )
            return validationOutput
        }

        const rootEntity = crate["@graph"].find((e) => e["@id"] === rootEntityId)
        if (!rootEntity) {
            validationOutput.push(
                this.createCrateError({
                    resultTitle: "Missing root entity",
                    resultDescription: `The root entity with @id '${rootEntityId}' was not found in the crate.`
                })
            )
            return validationOutput
        }

        classRuleMapping.set(rootEntityId, rootEntityClassRuleId)
        queue.push(metadataDescriptorEntity["@id"], rootEntityId)

        while (queue.length > 0) {
            const entityId = queue.shift()!
            if (done.has(entityId)) continue
            done.add(entityId)

            const classRuleId = classRuleMapping.get(entityId)
            if (!classRuleId) continue

            const classRule = def.classes.find((c) => c["@id"] === classRuleId)
            if (!classRule) continue

            const entity = crate["@graph"].find((e) => e["@id"] === entityId)
            if (!entity) continue

            const typeResults = this.validateEntityType(entity, classRule)
            validationOutput.push(...typeResults)

            const propertyRuleResults = this.validateEntityPropertyRules(entity, classRule, def, crate, classRuleMapping)
            validationOutput.push(...propertyRuleResults)

            const propertyRulesForClass = this.getPropertyRulesForClass(def, classRuleId)
            for (const propRule of propertyRulesForClass) {
                if (!propRule.rangeIncludes) continue

                const targetClassRuleId = this.findClassRuleIdByRange(def, propRule.rangeIncludes)
                if (!targetClassRuleId) continue

                const propValues = propertyValue(entity[propRule.label] ?? [])
                propValues.forEach((value) => {
                    if (PropertyValueUtils.isRef(value) && !propertyValue(value).isEmpty()) {
                        const refId = (value as IReference)["@id"]
                        if (refId && !classRuleMapping.has(refId)) {
                            classRuleMapping.set(refId, targetClassRuleId)
                            queue.push(refId)
                        }
                    }
                })
            }
        }

        for (const classRule of def.classes) {
            if (classRule.minCount === undefined && classRule.maxCount === undefined) continue

            const matchingEntities = [...classRuleMapping.entries()]
                .filter(([, ruleId]) => ruleId === classRule["@id"])
                .map(([entityId]) => entityId)
            const count = matchingEntities.length

            if (classRule.minCount !== undefined && count < classRule.minCount) {
                validationOutput.push(
                    this.createCrateError({
                        resultTitle:
                            count === 0
                                ? `${this.classRuleDisplayName(classRule)} entity is required`
                                : `Too few ${this.classRuleDisplayName(classRule)} entities`,
                        resultDescription: `There must be at least ${classRule.minCount} ${this.classRuleDisplayName(classRule)} entities in this RO-Crate.`
                    })
                )
            }

            if (classRule.maxCount !== undefined && count > classRule.maxCount) {
                validationOutput.push(
                    this.createCrateError({
                        resultTitle: `Too many ${this.classRuleDisplayName(classRule)} entities`,
                        resultDescription: `There can be at most ${classRule.maxCount} ${this.classRuleDisplayName(classRule)} entities in this RO-Crate.`
                    })
                )
            }
        }

        return validationOutput
    }

    private findClassRuleWithMetadataDescriptorProperty(def: {
        classes: ProfileClass[]
        properties: ProfileProperty[]
    }) {
        return def.classes.find((classRule) => {
            return def.properties.some((propRule) => {
                if (propRule.label !== "@id") return false
                if (!propRule.domainIncludes.some((d) => d["@id"] === classRule["@id"])) return false
                if (!propRule.options) return false
                return (
                    propRule.options.length === 1 && propRule.options[0] === "ro-crate-metadata.json"
                )
            })
        })
    }

    private findPropertyRuleForLabel(
        def: { classes: ProfileClass[]; properties: ProfileProperty[] },
        classRuleId: string,
        label: string
    ): ProfileProperty | undefined {
        return def.properties.find((propRule) => {
            if (propRule.label !== label) return false
            return propRule.domainIncludes.some((d) => d["@id"] === classRuleId)
        })
    }

    private findClassRuleIdByRange(
        def: { classes: ProfileClass[] },
        rangeIncludes?: IReference[]
    ): string | undefined {
        if (!rangeIncludes) return undefined
        return def.classes.find((c) => rangeIncludes.some((r) => r["@id"] === c["@id"]))?.["@id"]
    }

    private getPropertyRulesForClass(
        def: { properties: ProfileProperty[] },
        classRuleId: string
    ): ProfileProperty[] {
        return def.properties.filter((propRule) =>
            propRule.domainIncludes.some((d) => d["@id"] === classRuleId)
        )
    }

    private validateEntityType(
        entity: IEntity,
        classRule: ProfileClass
    ): ValidationResultWithoutTrace[] {
        if (!classRule.specializationOf || classRule.specializationOf.length === 0) return []

        const results: ValidationResultWithoutTrace[] = []
        const requiredTypes = classRule.specializationOf.map((ref) => {
            const resolved = this.getContext().resolver.reverse(ref["@id"])
            return resolved ?? ref["@id"]
        })

        const entityTypes = toArray(entity["@type"]).map((t) => {
            const resolved = this.getContext().resolver.reverse(t)
            return resolved ?? t
        })

        const missingTypes = requiredTypes.filter((t) => !entityTypes.includes(t))
        if (missingTypes.length > 0) {
            results.push({
                id: crypto.randomUUID(),
                entityId: entity["@id"],
                validatorName: this.name,
                resultTitle: `Invalid entity type`,
                resultDescription: `Entity must have type(s): ${requiredTypes.join(", ")}. Missing: ${missingTypes.join(", ")}.`,
                resultSeverity: ValidationResultSeverity.error,
                ruleName: "specializationOfMismatch"
            })
        }

        return results
    }

    private validateEntityPropertyRules(
        entity: IEntity,
        classRule: ProfileClass,
        def: { classes: ProfileClass[]; properties: ProfileProperty[] },
        crate: ICrate,
        classRuleMapping: Map<string, string>
    ): ValidationResultWithoutTrace[] {
        const results: ValidationResultWithoutTrace[] = []
        const propertyRules = this.getPropertyRulesForClass(def, classRule["@id"])

        for (const propRule of propertyRules) {
            const propExists = propRule.label in entity

            if (propRule.minCount !== undefined || propRule.maxCount !== undefined) {
                let count = 0
                propertyValue(propExists ? entity[propRule.label] : []).forEach(() => count++)

                if (propRule.minCount !== undefined && count < propRule.minCount) {
                    results.push({
                        id: crypto.randomUUID(),
                        entityId: entity["@id"],
                        propertyName: propExists ? propRule.label : undefined,
                        validatorName: this.name,
                        resultTitle:
                            count === 0
                                ? `Property ${propRule.label} is required`
                                : `Property ${propRule.label} has too few values`,
                        resultDescription: `Property ${propRule.label} must have at least ${propRule.minCount} value(s)`,
                        resultSeverity: ValidationResultSeverity.error,
                        ruleName: "propertyMinCount"
                    })
                }

                if (propRule.maxCount !== undefined && count > propRule.maxCount) {
                    results.push({
                        id: crypto.randomUUID(),
                        entityId: entity["@id"],
                        propertyName: propRule.label,
                        validatorName: this.name,
                        resultTitle: `Property ${propRule.label} has too many values`,
                        resultDescription: `Property ${propRule.label} can have at most ${propRule.maxCount} value(s)`,
                        resultSeverity: ValidationResultSeverity.error,
                        ruleName: "propertyMaxCount"
                    })
                }
            }

            if (propRule.options && propExists) {
                let index = 0
                propertyValue(entity[propRule.label]).forEach((value) => {
                    if (propertyValue(value).isEmpty()) return
                    const valid = propRule.options!.some((option) => {
                        if (typeof value === "object" && value !== null && "@id" in value) {
                            return (option as IReference)["@id"] === (value as IReference)["@id"]
                        }
                        return value === option
                    })
                    if (!valid) {
                        results.push({
                            id: crypto.randomUUID(),
                            entityId: entity["@id"],
                            propertyName: propRule.label,
                            propertyIndex: index,
                            validatorName: this.name,
                            resultTitle: `Property has illegal value`,
                            resultDescription: `Property ${propRule.label} must have one of the following values: ${propRule.options!.map((o) => JSON.stringify(o)).join(", ")}`,
                            resultSeverity: ValidationResultSeverity.error,
                            ruleName: "propertyOptions"
                        })
                    }
                    index++
                })
            }

            if (propRule.rangeIncludes && propExists) {
                const rangeIncludesClassRuleIds = propRule.rangeIncludes
                    .map((ref) => ref["@id"])

                if (rangeIncludesClassRuleIds.length > 0 && rangeIncludesClassRuleIds.every((id) => def.classes.some((c) => c["@id"] === id))) {
                    let index = 0
                    propertyValue(entity[propRule.label]).forEach((value) => {
                        if (propertyValue(value).isEmpty()) {
                            results.push({
                                id: crypto.randomUUID(),
                                entityId: entity["@id"],
                                propertyName: propRule.label,
                                propertyIndex: index,
                                validatorName: this.name,
                                resultTitle: `Property ${propRule.label} has empty reference`,
                                resultDescription: `Property ${propRule.label} must have a valid reference`,
                                resultSeverity: ValidationResultSeverity.error,
                                ruleName: "rangeIncludesEmptyRef"
                            })
                        } else if (PropertyValueUtils.isRef(value)) {
                            const refId = (value as IReference)["@id"]
                            const assignedClassRuleId = classRuleMapping.get(refId)
                            if (assignedClassRuleId && !rangeIncludesClassRuleIds.includes(assignedClassRuleId)) {
                                results.push({
                                    id: crypto.randomUUID(),
                                    entityId: entity["@id"],
                                    propertyName: propRule.label,
                                    propertyIndex: index,
                                    validatorName: this.name,
                                    resultTitle: `Property ${propRule.label} references entity with mismatched class rule`,
                                    resultDescription: `Property ${propRule.label} references "${refId}" which is assigned to class rule "${assignedClassRuleId}", but this class rule is not in the allowed range for this property`,
                                    resultSeverity: ValidationResultSeverity.error,
                                    ruleName: "rangeIncludesMismatch"
                                })
                            }
                        }
                        index++
                    })
                }
            }
        }

        return results
    }

    private createCrateError(data: {
        resultTitle: string
        resultDescription: string
    }): ValidationResultWithoutTrace {
        return {
            id: crypto.randomUUID(),
            validatorName: this.name,
            resultTitle: data.resultTitle,
            resultDescription: data.resultDescription,
            resultSeverity: ValidationResultSeverity.error,
            ruleName: "profileDefinition"
        }
    }

    private classRuleDisplayName(rule: ProfileClass): string {
        return rule.label || rule.name || rule["@id"]
    }
}
