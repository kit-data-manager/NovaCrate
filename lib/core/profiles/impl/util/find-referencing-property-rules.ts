import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { PropertyRule } from "@/lib/core/profiles/types/PropertyRule"

/**
 * A property rule that can reference an entity conforming to a given entity rule, together with
 * the handler that declared it and the entity rules the property may be used on.
 */
export type ReferencingPropertyRule = {
    handler: IProfileHandler
    propertyRule: PropertyRule
    /** The entity rules (resolved from `appliesToEntityRules`) the property can be used on. */
    appliesToEntityRules: EntityRule[]
}

/**
 * Finds all property rules across the given profile handlers whose range includes the given
 * entity rule — either directly via `rangeIncludes`, or indirectly via an object-valued
 * property value rule whose value references the entity rule. This answers the question
 * "how can an entity conforming to this rule be referenced in a crate".
 *
 * Property rules with `options` are excluded, since options take precedence over `rangeIncludes`
 * and match concrete values rather than rule conformance.
 */
export function findReferencingPropertyRules(
    entityRule: EntityRule,
    handlers: IProfileHandler[]
): ReferencingPropertyRule[] {
    const results: ReferencingPropertyRule[] = []

    for (const handler of handlers) {
        const definition = handler.getDefinition()
        if (!definition || !handler.getIsReady()) continue

        for (const propertyRule of definition.propertyRules) {
            if (propertyRule.options) continue
            if (!propertyRuleRangeIncludesEntityRule(propertyRule, entityRule, handler)) continue

            results.push({
                handler,
                propertyRule,
                appliesToEntityRules: propertyRule.appliesToEntityRules
                    .map((id) => handler.getEntityRule(id))
                    .filter((rule): rule is EntityRule => rule !== undefined)
            })
        }
    }

    return results
}

function propertyRuleRangeIncludesEntityRule(
    propertyRule: PropertyRule,
    entityRule: EntityRule,
    handler: IProfileHandler
): boolean {
    const range = propertyRule.rangeIncludes
    if (!range) return false

    if (range.includes(entityRule["@id"])) return true

    // Indirect reference: an object-valued property value rule anticipates a reference to an
    // entity conforming to the given rule (mirrors the logic in `checkPropertyRange`).
    return range.some((rangeItem) => {
        const propertyValueRule = handler.getPropertyValueRule(rangeItem)
        if (!propertyValueRule || typeof propertyValueRule.value !== "object") return false
        return propertyValueRule.value["@id"] === entityRule["@id"]
    })
}
