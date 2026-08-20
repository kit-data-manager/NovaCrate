import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { createEntityForRule } from "@/lib/core/profiles/impl/util/entity-rule-to-entity"
import { useCallback, useContext } from "react"
import { useProfileService } from "@/lib/hooks/use-profile-service"
import { useContextResolver } from "@/lib/hooks/hooks"
import { SchemaWorker } from "@/components/providers/schema-worker-provider"

/**
 * Creates a minimal entity based on the given {@link EntityRule}. If no entity is given, the create function returns undefined
 * @param entityRule The entity rule to create minimal entities for. If left undefined, then the create function does not create an entity and returns undefined
 */
export function useEntityFromRule(entityRule?: EntityRule) {
    const profileService = useProfileService()
    const resolver = useContextResolver()
    const schemaWorker = useContext(SchemaWorker)

    return useCallback(
        async (id: string) => {
            let entityFromEntityRule: IEntity | undefined = undefined
            if (entityRule) {
                const handler = profileService.getProfileHandler(entityRule.onHandler)
                if (handler) {
                    try {
                        entityFromEntityRule = await createEntityForRule(
                            handler,
                            id,
                            entityRule,
                            resolver,
                            schemaWorker.worker
                        )
                    } catch (e) {
                        console.error(
                            "Tried to create entity from profile rule but failed. Falling back to empty entity",
                            e
                        )
                    }
                }
            }

            return entityFromEntityRule
        },
        [entityRule, profileService, resolver, schemaWorker.worker]
    )
}
