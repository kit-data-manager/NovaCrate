import { useCore } from "@/components/providers/core-provider"
import { Profile } from "@/components/context/profile"
import { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Error } from "@/components/error"

export function Profiles() {
    const core = useCore()
    const profileService = core.getProfileService()
    const [profiles, setProfiles] = useState(profileService.getProfileHandlers())
    const [errors, setErrors] = useState(profileService.getAllErrors())

    useEffect(() => {
        setProfiles(profileService.getProfileHandlers())
        const remove1 = profileService.events.addEventListener("profiles-changed", (profiles) =>
            setProfiles(profiles)
        )
        setErrors(profileService.getAllErrors())
        const remove2 = profileService.events.addEventListener("error-emitted", () => {
            setErrors(profileService.getAllErrors())
        })

        return () => {
            remove1()
            remove2()
        }
    }, [profileService])

    return (
        <div className="space-y-2">
            <div className="font-bold">Profiles</div>
            {profiles.map((profile) => (
                <Profile profile={profile} key={profile.id} />
            ))}
            {errors.length > 0 && (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="destructive">View {errors.length} Errors</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Profile System Errors</DialogTitle>
                        </DialogHeader>

                        <div className="max-h-[80vh] overflow-y-auto space-y-2">
                            {errors.map((error, i) => (
                                <Error
                                    title={"An error occurred while parsing"}
                                    error={error}
                                    key={i}
                                />
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
