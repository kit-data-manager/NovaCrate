import { ValidationResultWithoutTrace } from "../validation-result"
import { Validator } from "../validator"
import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"
import {
    checkEntityConformance,
    entityMatchesRuleTypes,
    EntityConformanceIssue
} from "@/lib/core/profiles/impl/util/entity-rule-conformance"
import { sortEntityRules } from "@/lib/core/profiles/impl/util/sort-entity-rules"
import { ValidationResultBuilder } from "@/lib/validation/validation-result-builder"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { ProfileDefinition } from "@/lib/core/profiles/types/ProfileDefinition"
import { editorState } from "@/lib/state/editor-state"
import { PropertyRule } from "@/lib/core/profiles/types/PropertyRule"
import { PropertyValueRule } from "@/lib/core/profiles/types/PropertyValueRule"
import { getDefaultValue } from "@/lib/core/profiles/impl/util/create-minimum-viable-entity"
import { useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"

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

        const entityMapping = this.profileHandler.getEntityMapping()
        const classRuleId = entityMapping.get(entity["@id"])
        if (!classRuleId) return []
        const classRule = this.profileHandler.getEntityRule(classRuleId)
        if (!classRule) return []

        const issues = checkEntityConformance(entity, classRule, this.profileHandler, {
            resolver: this.getContext().resolver,
            getEntity: (id) => this.getContext().editorState.getEntities().get(id),
            isEntityAssignedTo: (entityId, entityRuleId) =>
                entityMapping.get(entityId) === entityRuleId
        })

        return this.translateIssues(issues, entity, classRule)
    }

    private translateIssues(
        issues: EntityConformanceIssue[],
        entity: IEntity,
        entityRule: EntityRule
    ): ValidationResultWithoutTrace[] {
        return issues.flatMap((issue) => {
            switch (issue.kind) {
                case "missingType":
                    return [this.buildMissingTypeResult(issue, entity, entityRule)]
                case "tooFewPropertyEntries":
                    return [this.buildTooFewEntriesResult(issue, entity)]
                case "tooManyPropertyEntries":
                    return [
                        this.resultBuilder.rule("tooManyPropertyEntries").error({
                            resultTitle: `Property \`${issue.rule.label}\` has too many entries`,
                            resultDescription: `The property \`${issue.rule.label}\` must not be present more than ${issue.rule.maxCount} times`,
                            entityId: entity["@id"],
                            propertyName: issue.rule.label,
                            propertyIndex: 0
                        })
                    ]
                case "invalidPropertyOption":
                    return [
                        this.resultBuilder.rule("invalidPropertyOption").error({
                            resultTitle: "Invalid value",
                            resultDescription: `The value of this property is not allowed under the ${this.profileHandler.getDefinition()!.name} profile. Possible options are: ${issue.rule.options!.map((o) => (typeof o === "object" ? "Reference to \`" + o["@id"] + "\`" : "\`" + o + "\`")).join(", ")}`,
                            entityId: entity["@id"],
                            propertyName: issue.rule.label,
                            propertyIndex: issue.index
                        })
                    ]
                case "tooFewPropertyValues":
                    return [this.buildTooFewValuesResult(issue, entity)]
                case "tooManyPropertyValues":
                    return issue.indices.map((i) =>
                        this.resultBuilder.rule("tooManyPropertyValues").error({
                            resultTitle: "Too many values",
                            resultDescription: `This property must contain ${describePropertyValueRule(issue.rule)} no more than ${issue.rule.maxCount} times`,
                            entityId: entity["@id"],
                            propertyName: issue.propertyRule.label,
                            propertyIndex: i,
                            actions: [
                                this.resultBuilder.action("remove", "Remove Value", () => {
                                    editorState
                                        .getState()
                                        .removePropertyEntry(
                                            entity["@id"],
                                            issue.propertyRule.label,
                                            i
                                        )
                                })
                            ]
                        })
                    )
                case "mismatchingReferenceType":
                    return [
                        this.resultBuilder.rule("mismatchingEntityType").error({
                            resultTitle:
                                "The referenced entity does not match any of the required types",
                            resultDescription: `The referenced entity is expected to be one of: ${issue.expectedRules.map((r) => "`" + classRuleName(r) + "`").join(", ")}`,
                            entityId: entity["@id"],
                            propertyName: issue.rule.label,
                            propertyIndex: issue.index
                        })
                    ]
            }
        })
    }

    private buildMissingTypeResult(
        issue: Extract<EntityConformanceIssue, { kind: "missingType" }>,
        entity: IEntity,
        entityRule: EntityRule
    ): ValidationResultWithoutTrace {
        return this.resultBuilder.rule("entityTypeMismatch").error({
            resultTitle: "The type of this entity does not match its profile",
            propertyName: "@type",
            entityId: entity["@id"],
            resultDescription: `This entity is a \`${classRuleName(entityRule)}\` entity, but its type does not match. The following types are missing: ${issue.missingTypes.map((t) => "`" + t + "`").join(", ")}`,
            actions: [
                this.resultBuilder.action("fix", "Fix", () => {
                    for (const missingType of issue.missingTypes) {
                        editorState.getState().addPropertyEntry(entity["@id"], "@type", missingType)
                    }
                })
            ]
        })
    }

    private buildTooFewEntriesResult(
        issue: Extract<EntityConformanceIssue, { kind: "tooFewPropertyEntries" }>,
        entity: IEntity
    ): ValidationResultWithoutTrace {
        const missingCount = issue.rule.minCount! - issue.count
        const handler = this.getContext().profileService.getProfileHandler(issue.rule.onHandler)

        if (issue.rule.minCount === 1) {
            return this.resultBuilder.rule("missingMandatoryProperty").error({
                resultTitle: `Missing \`${issue.rule.label}\` property`,
                resultDescription: `The mandatory property \`${issue.rule.label}\` is missing from this entity`,
                entityId: entity["@id"],
                actions: this.buildAddPropertyAction(entity, issue.rule, handler, missingCount)
            })
        }

        return this.resultBuilder.rule("tooFewMandatoryProperties").error({
            resultTitle: `Property \`${issue.rule.label}\` too few entries`,
            resultDescription: `The mandatory property \`${issue.rule.label}\` must be present at least ${issue.rule.minCount} times`,
            entityId: entity["@id"],
            actions: this.buildAddPropertyAction(entity, issue.rule, handler, missingCount)
        })
    }

    private buildTooFewValuesResult(
        issue: Extract<EntityConformanceIssue, { kind: "tooFewPropertyValues" }>,
        entity: IEntity
    ): ValidationResultWithoutTrace {
        if (issue.rule.minCount === 1) {
            return this.resultBuilder.rule("missingMandatoryPropertyValue").error({
                resultTitle: "Missing mandatory value",
                resultDescription: `This property must contain ${describePropertyValueRule(issue.rule)}`,
                entityId: entity["@id"],
                propertyName: issue.propertyRule.label,
                actions: [
                    this.resultBuilder.action("add-missing", "Add Value", () => {
                        editorState
                            .getState()
                            .addPropertyEntry(
                                entity["@id"],
                                issue.propertyRule.label,
                                issue.rule.value
                            )
                    })
                ]
            })
        }

        return this.resultBuilder.rule("tooFewMandatoryPropertyValues").error({
            resultTitle: "Too few mandatory values",
            resultDescription: `This property must contain ${describePropertyValueRule(issue.rule)} at least ${issue.rule.minCount} times`,
            entityId: entity["@id"],
            propertyName: issue.propertyRule.label,
            actions: [
                this.resultBuilder.action("add-missing", "Add Values", () => {
                    for (let i = issue.count; i < (issue.rule.minCount ?? 0); i++) {
                        editorState
                            .getState()
                            .addPropertyEntry(
                                entity["@id"],
                                issue.propertyRule.label,
                                issue.rule.value
                            )
                    }
                })
            ]
        })
    }

    private buildAddPropertyAction(
        entity: IEntity,
        propertyRule: PropertyRule,
        handler: IProfileHandler | undefined,
        missingCount: number
    ) {
        if (!handler || missingCount <= 0) return []
        return [
            this.resultBuilder.action("add-property", "Add", async () => {
                const value = await getDefaultValue(
                    handler,
                    propertyRule,
                    this.getContext().resolver,
                    this.getContext().schemaWorker.worker
                )
                for (let i = 0; i < missingCount; i++) {
                    editorState
                        .getState()
                        .addPropertyEntry(entity["@id"], propertyRule.label, value)
                }
                setTimeout(
                    () =>
                        useEntityEditorTabs
                            .getState()
                            .focusProperty(entity["@id"], propertyRule.label),
                    100
                )
            })
        ]
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

        for (const classRule of def.entityRules) {
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

        results.push(...this.findUnassignedProfileEntities(def, mapping))

        return results
    }

    /**
     * Entities whose types match an entity rule of this profile but that are not present in the
     * entity mapping. Entities are only mapped through references from other entities, so an
     * entity without incoming references would silently be invisible to profile validation.
     */
    private findUnassignedProfileEntities(
        def: ProfileDefinition,
        mapping: Map<string, string>
    ): ValidationResultWithoutTrace[] {
        const results: ValidationResultWithoutTrace[] = []
        const mappedIds = new Set(mapping.keys())

        // Only rules that declare at least one required type can trigger the unassigned-item
        // warning; a rule without specializationOf would match every entity.
        const sortedRules = [...def.entityRules]
            .filter((rule) => (rule.specializationOf ?? []).length > 0)
            .sort((a, b) => sortEntityRules(a, b, this.profileHandler))

        for (const entity of this.getContext().editorState.getEntities().values()) {
            if (mappedIds.has(entity["@id"])) continue

            const matchingRule = sortedRules.find((rule) =>
                entityMatchesRuleTypes(entity, rule, this.getContext().resolver)
            )
            if (!matchingRule) continue

            results.push(
                this.resultBuilder.rule("unassignedProfileEntity").softWarning({
                    resultTitle: "This entity is not assigned to a profile rule",
                    resultDescription: `The entity matches the entity rule \`${classRuleName(matchingRule)}\` of profile ${def.name}, but no property in this crate references it. Entities are assigned to profile rules through references, so this entity is currently not validated against the profile.`,
                    entityId: entity["@id"]
                })
            )
        }

        return results
    }
}

function classRuleName(c: EntityRule) {
    return c.name || c.label || c["@id"]
}

function describePropertyValueRule(c: PropertyValueRule) {
    return typeof c.value === "object"
        ? "a reference to `" + c.value["@id"] + "`"
        : "the value `" + c.value + "`"
}
