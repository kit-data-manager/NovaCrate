import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"
import { PropertyRule } from "@/lib/core/profiles/types/PropertyRule"
import { propertyCanBe } from "@/lib/hooks/property-can-be"
import { IContextResolverService } from "@/lib/core/IContextResolverService"
import { ISchemaWorkerContext } from "@/components/providers/schema-worker-provider"
import { determinePropertyRuleRange } from "@/lib/core/profiles/impl/util/determine-property-rule-range"
import { getPropertyTypeDefaultValue, PropertyType } from "@/lib/property"
import { hasAtLeastOneValue, pickFirst } from "@/lib/utils"

export async function createMinimumViableEntity(
    handler: IProfileHandler,
    id: string,
    rule: EntityRule,
    resolver: IContextResolverService,
    schemaWorker: ISchemaWorkerContext["worker"]
): Promise<IEntity> {
    const properties = getMandatoryProperties(handler, rule)
    const fallbackType = "Thing"
    const resolvedTypes = rule.specializationOf
        ? rule.specializationOf.map((typeUrl) => resolver.reverse(typeUrl) ?? typeUrl)
        : []

    const base: IEntity = {
        "@id": id,
        "@type": resolvedTypes.length > 0 ? resolvedTypes : fallbackType
    }

    console.log(properties)

    for (const property of properties) {
        base[property.label] = await getDefaultValue(handler, property, resolver, schemaWorker)
        console.log(property.label, base[property.label])
    }

    return base
}

export async function getDefaultValue(
    profileHandler: IProfileHandler,
    propertyRule: PropertyRule,
    resolver: IContextResolverService,
    schemaWorker: ISchemaWorkerContext["worker"]
) {
    try {
        const propertyRuleRange = await determinePropertyRuleRange(
            profileHandler,
            propertyRule,
            resolver,
            schemaWorker
        )

        if (propertyRuleRange.mandatoryValue) return propertyRuleRange.mandatoryValue

        const range =
            propertyRuleRange.rangeIncludesTypes.length > 0
                ? propertyRuleRange.rangeIncludesTypes
                : propertyRuleRange.baseTypes || []
        const canBe = propertyCanBe(range)

        return getPropertyTypeDefaultValue(
            hasAtLeastOneValue(canBe.possiblePropertyTypes)
                ? pickFirst(canBe.possiblePropertyTypes)
                : PropertyType.Text
        )
    } catch (e) {
        console.warn(
            `Could not determine default value of properties corresponding to rule ${propertyRule.label}, falling back to default`,
            e
        )
        return getPropertyTypeDefaultValue(PropertyType.Text)
    }
}

function getMandatoryProperties(handler: IProfileHandler, rule: EntityRule) {
    const propertyRules = handler.getPropertyRulesFor(rule["@id"])

    return propertyRules.filter((rule) => rule.minCount !== undefined && rule.minCount >= 1)
}
