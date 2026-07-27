import { useCore } from "@/components/providers/core-provider"
import { useCallback, useEffect, useMemo, useState } from "react"
import { deepEqual } from "@/lib/utils"
import { ProfileEntityMapping } from "@/lib/core/profiles/types/ProfileEntityMapping"

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
