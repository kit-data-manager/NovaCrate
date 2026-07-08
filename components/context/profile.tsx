import { IProfile } from "@/lib/core/profiles/IProfile"
import { useEffect, useState } from "react"
import { Error } from "@/components/error"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function Profile({ profile }: { profile: IProfile }) {
    const def = profile.getDefinition()
    const [ready, setReady] = useState(profile.getIsReady())
    const [errors, setErrors] = useState(profile.getErrors())

    useEffect(() => {
        setReady(profile.getIsReady())
        const remove1 = profile.events.addEventListener("ready-changed", setReady)
        setErrors(profile.getErrors())
        const remove2 = profile.events.addEventListener("error-emitted", () => {
            setErrors(profile.getErrors())
        })

        return () => {
            remove1()
            remove2()
        }
    }, [profile])

    if (!ready) return <div>Loading...</div>

    if (!def)
        return (
            <Error
                title="Profile has no definition"
                error={`This profile does not provide a definition`}
            />
        )

    return (
        <div className="border rounded-lg p-2">
            <div className={"mb-1"}>
                {def.name} {def.version || ""}{" "}
                <span className="text-sm text-muted-foreground">{def["@id"]}</span>
            </div>
            <div className="flex gap-1">
                <Badge>{profile.name}</Badge>
                <Badge variant="secondary">{def.classes.length} Class Rules</Badge>
                <Badge variant="secondary">{def.properties.length} Property Rules</Badge>
                <Tooltip>
                    <Dialog>
                        <TooltipTrigger asChild>
                            <DialogTrigger asChild>
                                {errors.length > 0 && (
                                    <Badge variant="destructive">{errors.length} Errors</Badge>
                                )}
                            </DialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Click to view</TooltipContent>

                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Profile Errors</DialogTitle>
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
                </Tooltip>
            </div>
        </div>
    )
}
