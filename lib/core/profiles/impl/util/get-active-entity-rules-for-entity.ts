import { IProfileService } from "@/lib/core/profiles/IProfileService"

export function getActiveEntityRulesForEntity(entityId: string, profileService: IProfileService) {
    const mappings = profileService.getEntityMappings()

    return (
        mappings
            .get(entityId)
            ?.map((mapping) =>
                profileService
                    .getProfileHandler(mapping.profileId)
                    ?.getEntityRule(mapping.entityRuleId)
            )
            .filter((c) => c !== undefined) ?? []
    )
}
