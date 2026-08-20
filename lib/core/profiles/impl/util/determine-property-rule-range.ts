import { PropertyRule } from "@/lib/core/profiles/types/PropertyRule"
import { IContextResolverService } from "@/lib/core/IContextResolverService"
import { ISchemaWorkerContext } from "@/components/providers/schema-worker-provider"
import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"
import { isValidUrl } from "@/lib/utils"

export async function determinePropertyRuleRange(
    profileHandler: IProfileHandler,
    propertyRule: PropertyRule,
    resolver: IContextResolverService,
    schemaWorker: ISchemaWorkerContext["worker"]
) {
    const baseTypes = propertyRule.specializationOf
        ? await schemaWorker.execute("getPropertyRange", propertyRule.specializationOf)
        : undefined
    const rangeIncludesTypes: string[] = []

    if (propertyRule.options !== undefined) {
        return {
            baseTypes: baseTypes,
            rangeIncludesTypes: [resolver.resolve("Text") ?? "Text"]
        }
    }

    if (propertyRule.rangeIncludes !== undefined) {
        for (const rangeItem of propertyRule.rangeIncludes) {
            const entityRule = profileHandler.getEntityRule(rangeItem)
            if (entityRule) {
                rangeIncludesTypes.push(
                    ...(entityRule.specializationOf
                        ? entityRule.specializationOf
                        : [resolver.resolve("Thing") ?? "Thing"])
                )
            } else if (profileHandler.getPropertyValueRule(rangeItem)) {
                const valueRule = profileHandler.getPropertyValueRule(rangeItem)!
                if (typeof valueRule.value === "object") {
                    rangeIncludesTypes.push(resolver.resolve("Thing") ?? "Thing")
                } else if (typeof valueRule.value === "number") {
                    rangeIncludesTypes.push(resolver.resolve("Number") ?? "Number")
                } else if (typeof valueRule.value === "boolean") {
                    rangeIncludesTypes.push(resolver.resolve("Boolean") ?? "Boolean")
                } else {
                    rangeIncludesTypes.push(resolver.resolve("Text") ?? "Text")
                }
            } else {
                // This must be a base term, resolve it and add it to the array
                rangeIncludesTypes.push(
                    isValidUrl(rangeItem) ? rangeItem : (resolver.resolve(rangeItem) ?? rangeItem)
                )
            }
        }
    }

    return { baseTypes: baseTypes, rangeIncludesTypes }
}
