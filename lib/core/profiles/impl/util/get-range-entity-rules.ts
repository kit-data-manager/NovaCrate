import { PropertyRule } from "@/lib/core/profiles/types/PropertyRule"
import { IProfileService } from "@/lib/core/profiles/IProfileService"

/**
 * Get all entity rules contained in the rangeIncludes of the given property rules
 * @param profileService
 * @param propertyRules
 */
export function getRangeEntityRules(
    profileService: IProfileService,
    propertyRules: PropertyRule[]
) {
    const entityRules: string[] = []
    for (const propertyRule of propertyRules) {
        const handler = profileService.getProfileHandler(propertyRule.onHandler)
        if (!handler || !propertyRule.rangeIncludes) continue

        for (const rangeItem of propertyRule.rangeIncludes) {
            if (handler.getEntityRule(rangeItem)) {
                entityRules.push(rangeItem)
            }
        }
    }
    return entityRules
}
