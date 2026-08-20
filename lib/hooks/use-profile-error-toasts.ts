import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { IProfileService } from "@/lib/core/profiles/IProfileService"

/**
 * Subscribes to profile construction failures and shows an error toast for
 * profile crates that fail to load. Each failing profile URI is toasted at most
 * once per mounted profile service, so repeated re-attempts do not stack toasts.
 */
export function useProfileErrorToasts(profileService: IProfileService | null) {
    const shownURIs = useRef<Set<string>>(new Set())

    useEffect(() => {
        if (!profileService) return
        shownURIs.current = new Set<string>()

        const showNewErrors = () => {
            for (const error of profileService.getProfileConstructionErrors()) {
                if (shownURIs.current.has(error.profileUri)) continue
                shownURIs.current.add(error.profileUri)
                toast.error(`Failed to load profile: ${error.profileUri}`, {
                    description: error.message,
                    dismissible: true
                })
            }
        }

        showNewErrors()
        const remove = profileService.events.addEventListener("error-emitted", showNewErrors)
        return () => remove()
    }, [profileService])
}
