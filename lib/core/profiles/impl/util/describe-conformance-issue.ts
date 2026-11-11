import { EntityConformanceIssue } from "@/lib/core/profiles/impl/util/entity-rule-conformance"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { PropertyValueRule } from "@/lib/core/profiles/types/PropertyValueRule"

/**
 * Presentation helpers for {@link EntityConformanceIssue}s. They turn the purely structural
 * conformance issues into human-readable titles and descriptions, mirroring the wording used by
 * the ProfileValidator's user-facing results. Shared by the entity editor UI and the AI assistant
 * so both present conformance problems consistently.
 */
export function getRuleName(rule: EntityRule) {
    return rule.name || rule.label || rule["@id"]
}

export function describeConformanceIssue(issue: EntityConformanceIssue): {
    title: string
    description: string
} {
    switch (issue.kind) {
        case "missingType":
            return {
                title: "The type of this entity does not match the rule",
                description: `The following types are missing: ${issue.missingTypes
                    .map((t) => `\`${t}\``)
                    .join(", ")}`
            }
        case "tooFewPropertyEntries": {
            const missingCount = issue.rule.minCount! - issue.count
            if (issue.rule.minCount === 1) {
                return {
                    title: `Missing \`${issue.rule.label}\` property`,
                    description: "The mandatory property is missing from this entity"
                }
            }
            return {
                title: `Property \`${issue.rule.label}\` has too few entries`,
                description: `The property must be present at least ${issue.rule.minCount} times, but it is present ${issue.count} times (${missingCount} missing)`
            }
        }
        case "tooManyPropertyEntries":
            return {
                title: `Property \`${issue.rule.label}\` has too many entries`,
                description: `The property must not be present more than ${issue.rule.maxCount} times, but it is present ${issue.count} times`
            }
        case "invalidPropertyOption":
            return {
                title: `Invalid value for \`${issue.rule.label}\``,
                description: `The value at position ${issue.index + 1} is not allowed. Possible options are: ${issue.rule
                    .options!.map((o) =>
                        typeof o === "object" ? "reference to \`" + o["@id"] + "\`" : `\`${o}\``
                    )
                    .join(", ")}`
            }
        case "tooFewPropertyValues":
            if (issue.rule.minCount === 1) {
                return {
                    title: `Missing mandatory value for \`${issue.propertyRule.label}\``,
                    description: `This property must contain ${describePropertyValueRule(issue.rule)}`
                }
            }
            return {
                title: `Too few mandatory values for \`${issue.propertyRule.label}\``,
                description: `This property must contain ${describePropertyValueRule(issue.rule)} at least ${issue.rule.minCount} times, but it occurs ${issue.count} times`
            }
        case "tooManyPropertyValues":
            return {
                title: `Too many values for \`${issue.propertyRule.label}\``,
                description: `This property must contain ${describePropertyValueRule(issue.rule)} no more than ${issue.rule.maxCount} times`
            }
        case "mismatchingReferenceType":
            return {
                title: `Referenced entity of \`${issue.rule.label}\` has a mismatching type`,
                description: `The entity referenced at position ${issue.index + 1} is expected to be one of: ${issue.expectedRules
                    .map((r) => `\`${getRuleName(r)}\``)
                    .join(", ")}`
            }
    }
}

function describePropertyValueRule(rule: PropertyValueRule) {
    return typeof rule.value === "object"
        ? "a reference to \`" + rule.value["@id"] + "\`"
        : "the value \`" + rule.value + "\`"
}
