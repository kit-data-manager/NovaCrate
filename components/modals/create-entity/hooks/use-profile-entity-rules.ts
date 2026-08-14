import { useCallback, useEffect, useState } from "react"
import { useCore } from "@/components/providers/core-provider"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"

/**
 * A profile's entity rules grouped together for display. Each entry corresponds
 * to one active profile handler and the entity rules its definition declares.
 */
export type ProfileEntityRules = {
    id: string
    profileName: string
    classes: EntityRule[]
}

/**
 * Reads the active profile handlers from the {@link IProfileService} and
 * collects their entity rules into a rendering-friendly shape. Returns an empty
 * array when no profiles are active or no definitions are ready yet.
 */
export function useProfileEntityRules(): ProfileEntityRules[] {
    const profile = useCore().getProfileService()

    const getProfileEntityRules = useCallback(() => {
        return profile.getProfileHandlers().map((p) => {
            const def = p.getDefinition()
            return {
                id: p.id,
                profileName: def?.name ?? p.name,
                classes: def ? def.entityRules : []
            }
        })
    }, [profile])

    const [profileEntityRules, setProfileEntityRules] = useState(() => getProfileEntityRules())

    useEffect(() => {
        const remove1 = profile.events.addEventListener("all-ready-changed", () => {
            setProfileEntityRules(getProfileEntityRules())
        })

        return () => remove1()
    }, [getProfileEntityRules, profile.events])

    return profileEntityRules
}
