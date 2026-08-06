import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"
import { PropertyRule } from "@/lib/core/profiles/types/PropertyRule"
import { propertyCanBe } from "@/lib/hooks/property-can-be"
import { IContextResolverService } from "@/lib/core/IContextResolverService"
import { ISchemaWorkerContext } from "@/components/providers/schema-worker-provider"
import { determinePropertyRuleRange } from "@/lib/core/profiles/impl/util/determine-property-rule-range"
import { getPropertyTypeDefaultValue, PropertyType } from "@/lib/property"
import { hasAtLeastOneValue, pickFirst, undefinedIfEmpty } from "@/lib/utils"

export async function createEntityForRule(
    handler: IProfileHandler,
    id: string,
    rule: EntityRule,
    resolver: IContextResolverService,
    schemaWorker: ISchemaWorkerContext["worker"]
): Promise<IEntity> {
    const properties = getMandatoryProperties(handler, rule)
    const resolvedTypes = undefinedIfEmpty(rule.specializationOf) !== undefined
        ? rule.specializationOf.map((typeUrl) => resolver.reverse(typeUrl) ?? typeUrl).filter(s => s !== null)
        : "Thing"

    const base: IEntity = {
        "@id": id,
        "@type": resolvedTypes
    }

    for (const property of properties) {
        base[property.label] = await getDefaultValue(handler, property, resolver, schemaWorker)
    }

    return base
}

export async function getDefaultValue(
    profileHandler: IProfileHandler,
    propertyRule: PropertyRule,
    resolver: IContextResolverService,
    schemaWorker: ISchemaWorkerContext["worker"]
) {
    const propertyRuleRange = await determinePropertyRuleRange(
        profileHandler,
        propertyRule,
        resolver,
        schemaWorker
    )
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
}

function getMandatoryProperties(handler: IProfileHandler, rule: EntityRule) {
    const propertyRules = handler.getPropertyRulesFor(rule["@id"])

    return propertyRules.filter((rule) => rule.minCount !== undefined && rule.minCount >= 1)
}
