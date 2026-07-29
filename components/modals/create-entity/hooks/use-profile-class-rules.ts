import { useMemo } from "react"
import { useCore } from "@/components/providers/core-provider"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"

/**
 * A profile's entity rules grouped together for display. Each entry corresponds
 * to one active profile handler and the entity rules its definition declares.
 */
export type ProfileClassRules = {
    id: string
    profileName: string
    classes: EntityRule[]
}

/**
 * Reads the active profile handlers from the {@link IProfileService} and
 * collects their entity rules into a rendering-friendly shape. Returns an empty
 * array when no profiles are active or no definitions are ready yet.
 */
export function useProfileClassRules(): ProfileClassRules[] {
    const profile = useCore().getProfileService()

    return useMemo(() => {
        return profile.getProfileHandlers().map((p) => {
            const def = p.getDefinition()
            return {
                id: p.id,
                profileName: p.name,
                classes: def ? def.entityRules : []
            }
        })
    }, [profile])
}
