import { IContextResolverService } from "@/lib/core/IContextResolverService"
import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { PropertyRule } from "@/lib/core/profiles/types/PropertyRule"
import { PropertyValueRule } from "@/lib/core/profiles/types/PropertyValueRule"
import { propertyValue, PropertyValueUtils } from "@/lib/property-value-utils"
import { isValidUrl, toArray } from "@/lib/utils"

/**
 * A single reason why an entity does not fully conform to an entity rule. Purely structural data
 * without any presentation logic, so it can be consumed both by the profile layer (e.g. to decide
 * whether an entity can be assigned to a rule) and by the validation layer (to build user-facing
 * results).
 */
export type EntityConformanceIssue =
    | { kind: "missingType"; missingTypes: string[] }
    | { kind: "tooFewPropertyEntries"; rule: PropertyRule; count: number }
    | { kind: "tooManyPropertyEntries"; rule: PropertyRule; count: number }
    | { kind: "invalidPropertyOption"; rule: PropertyRule; index: number }
    | {
          kind: "tooFewPropertyValues"
          propertyRule: PropertyRule
          rule: PropertyValueRule
          count: number
      }
    | {
          kind: "tooManyPropertyValues"
          propertyRule: PropertyRule
          rule: PropertyValueRule
          indices: number[]
      }
    | {
          kind: "mismatchingReferenceType"
          rule: PropertyRule
          index: number
          expectedRules: EntityRule[]
      }

/**
 * The subset of {@link IProfileHandler} required to resolve rule references during a conformance check.
 */
export type EntityConformanceRuleLookup = Pick<
    IProfileHandler,
    "getPropertyRulesFor" | "getPropertyValueRule" | "getEntityRule"
>

export type EntityConformanceContext = {
    /** Resolver for translating short-form type names into full URIs. */
    resolver: IContextResolverService
    /** Lookup for entities of the graph, needed to check the types of referenced entities. */
    getEntity: (id: string) => IEntity | undefined
    /**
     * Optional hook to treat an entity as matching an entity rule it is already assigned to, even if
     * its types alone would not match. Mirrors the behavior of the entity mapping.
     */
    isEntityAssignedTo?: (entityId: string, entityRuleId: string) => boolean
}

/**
 * Checks whether the given entity is of the expected type for the given entity rule.
 * A rule without `specializationOf` matches entities of any type.
 */
export function entityMatchesRuleTypes(
    entity: IEntity,
    entityRule: EntityRule,
    resolver: IContextResolverService
): boolean {
    return findMissingTypes(entity, entityRule, resolver).length === 0
}

/**
 * Checks an entity against an entity rule and returns all conformance issues found. An empty
 * array means the entity fully conforms to the rule.
 *
 * Note: cardinality constraints on the entity rule itself (minCount/maxCount) are deliberately
 * not part of this check, since they constrain how often a rule may be used in a crate, not
 * whether a single entity conforms to it.
 */
export function checkEntityConformance(
    entity: IEntity,
    entityRule: EntityRule,
    ruleLookup: EntityConformanceRuleLookup,
    ctx: EntityConformanceContext
): EntityConformanceIssue[] {
    const issues: EntityConformanceIssue[] = []

    const missingTypes = findMissingTypes(entity, entityRule, ctx.resolver)
    if (missingTypes.length > 0) {
        issues.push({ kind: "missingType", missingTypes })
    }

    for (const propertyRule of ruleLookup.getPropertyRulesFor(entityRule["@id"])) {
        let propertyCount = 0
        if (propertyRule.label in entity) {
            const property = entity[propertyRule.label]

            propertyCount = toArray(property).length

            if (propertyRule.options) {
                checkPropertyOptions(property, propertyRule, issues)
            } else if (propertyRule.rangeIncludes) {
                checkPropertyRange(property, propertyRule, ruleLookup, ctx, issues)
            }
        }

        checkPropertyCount(propertyRule, propertyCount, issues)
    }

    return issues
}

function findMissingTypes(
    entity: IEntity,
    entityRule: EntityRule,
    resolver: IContextResolverService
): string[] {
    const entityTypes = toArray(entity["@type"]).map((type) =>
        isValidUrl(type) ? type : (resolver.resolve(type) ?? type)
    )
    return (entityRule.specializationOf ?? []).filter((t) => !entityTypes.includes(t))
}

function checkPropertyCount(
    propertyRule: PropertyRule,
    propertyCount: number,
    issues: EntityConformanceIssue[]
) {
    if (propertyRule.minCount !== undefined && propertyCount < propertyRule.minCount) {
        issues.push({
            kind: "tooFewPropertyEntries",
            rule: propertyRule,
            count: propertyCount
        })
    }

    if (propertyRule.maxCount !== undefined && propertyCount > propertyRule.maxCount) {
        issues.push({
            kind: "tooManyPropertyEntries",
            rule: propertyRule,
            count: propertyCount
        })
    }
}

function checkPropertyOptions(
    property: string | IReference | (string | IReference)[],
    propertyRule: PropertyRule,
    issues: EntityConformanceIssue[]
) {
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
            issues.push({ kind: "invalidPropertyOption", rule: propertyRule, index: i })
        }
    })
}

function checkPropertyRange(
    property: string | IReference | (string | IReference)[],
    propertyRule: PropertyRule,
    ruleLookup: EntityConformanceRuleLookup,
    ctx: EntityConformanceContext,
    issues: EntityConformanceIssue[]
) {
    const entityRules: EntityRule[] = []
    const propertyValueRules: PropertyValueRule[] = []

    // Classify each entry into one of the categories above. Types is the fallback category
    for (const targetElementId of propertyRule.rangeIncludes!) {
        const entityRule = ruleLookup.getEntityRule(targetElementId)
        if (entityRule) entityRules.push(entityRule)
        else {
            const propertyValueRule = ruleLookup.getPropertyValueRule(targetElementId)
            if (propertyValueRule) propertyValueRules.push(propertyValueRule)
        }
    }

    checkPropertyValueRules(property, propertyRule, propertyValueRules, issues)
    checkPropertyTargets(property, propertyRule, entityRules, ctx, issues)
}

function checkPropertyValueRules(
    propertyVal: string | IReference | (string | IReference)[],
    propertyRule: PropertyRule,
    propertyValueRules: PropertyValueRule[],
    issues: EntityConformanceIssue[]
) {
    for (const propertyValueRule of propertyValueRules) {
        const matchingIndices: number[] = []
        propertyValue(propertyVal).forEach((value, i) => {
            let match = false
            if (typeof propertyValueRule.value === "object" && typeof value === "object") {
                if (propertyValueRule.value["@id"] === value["@id"]) match = true
            } else if (typeof propertyValueRule.value === "string" && typeof value === "string") {
                if (propertyValueRule.value === value) match = true
            }

            if (match) {
                matchingIndices.push(i)
            }
        })

        const matches = matchingIndices.length

        if (propertyValueRule.minCount !== undefined && matches < propertyValueRule.minCount) {
            issues.push({
                kind: "tooFewPropertyValues",
                propertyRule,
                rule: propertyValueRule,
                count: matches
            })
        }

        if (propertyValueRule.maxCount !== undefined && matches > propertyValueRule.maxCount) {
            issues.push({
                kind: "tooManyPropertyValues",
                propertyRule,
                rule: propertyValueRule,
                indices: [...matchingIndices]
            })
        }
    }
}

function checkPropertyTargets(
    property: string | IReference | (string | IReference)[],
    propertyRule: PropertyRule,
    entityRules: EntityRule[],
    ctx: EntityConformanceContext,
    issues: EntityConformanceIssue[]
) {
    propertyValue(property).forEach((value, i) => {
        if (!PropertyValueUtils.isRef(value)) return

        const target = ctx.getEntity(value["@id"])
        if (!target) return

        const resolved = toArray(target["@type"]).map((type) => ctx.resolver.resolve(type) ?? type)

        let match = false
        for (const entityRule of entityRules) {
            if (match) break

            if (!entityRule.specializationOf) {
                match = true
                continue
            }

            if (ctx.isEntityAssignedTo?.(target["@id"], entityRule["@id"])) {
                match = true
                continue
            }

            const missingTypes = entityRule.specializationOf.filter(
                (type) => !resolved.includes(type)
            )
            if (missingTypes.length === 0) {
                match = true
            }
        }

        if (!match) {
            issues.push({
                kind: "mismatchingReferenceType",
                rule: propertyRule,
                index: i,
                expectedRules: entityRules
            })
        }
    })
}
