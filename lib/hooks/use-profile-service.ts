import { useCore } from "@/components/providers/core-provider"
import { useCallback, useEffect, useMemo, useState } from "react"
import { deepEqual } from "@/lib/utils"
import { ProfileEntityMapping } from "@/lib/core/profiles/types/ProfileEntityMapping"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"

export function useProfileService() {
    const core = useCore()
    return core.getProfileService()
}

export function useProfileEntityMapping(entityId: string) {
    const profileService = useProfileService()
    const [stableMapping, setStableMapping] = useState<ProfileEntityMapping[] | undefined>()

    const updateStableMapping = useCallback(
        (mappings: Map<string, ProfileEntityMapping[]>) => {
            const match = mappings.get(entityId)
            setStableMapping((current) => {
                if (!deepEqual(current, match)) return match
                else return current
            })
        },
        [entityId]
    )

    useEffect(() => {
        const remove = profileService.events.addEventListener("mappings-updated", (mappings) => {
            updateStableMapping(mappings)
        })

        updateStableMapping(profileService.getEntityMappings())

        return () => remove()
    }, [profileService, profileService.events, updateStableMapping])

    return useMemo(() => {
        return stableMapping
    }, [stableMapping])
}

export function useActiveEntityRules(entityId?: string) {
    const profileService = useCore().getProfileService()

    const [roles, setRoles] = useState<{ rule: EntityRule; handler: IProfileHandler }[]>()

    const determineRoles = useCallback(() => {
        const roles = entityId
            ? profileService
                  .getProfileHandlers()
                  .map((handler) => {
                      const ruleId = handler.getEntityMapping().get(entityId)
                      if (ruleId) {
                          const rule = handler.getEntityRule(ruleId)
                          if (rule) return { rule, handler }
                      } else return undefined
                  })
                  .filter((p) => p !== undefined)
            : []

        setRoles(roles)
    }, [entityId, profileService])

    useEffect(() => {
        determineRoles()
        const remove1 = profileService.events.addEventListener("profiles-changed", () => {
            determineRoles()
        })
        const remove2 = profileService.events.addEventListener("all-ready-changed", () => {
            determineRoles()
        })

        return () => {
            remove1()
            remove2()
        }
    }, [determineRoles, profileService.events])

    return roles
}
