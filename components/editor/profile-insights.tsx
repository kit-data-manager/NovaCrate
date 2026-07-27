import { useCore } from "@/components/providers/core-provider"
import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { BoxIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { MarkdownComment } from "@/components/markdown-comment"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"

export function ProfileInsights({ entity }: { entity: IEntity }) {
    const profileService = useCore().getProfileService()

    const [roles, setRoles] = useState<{ rule: EntityRule; handler: IProfileHandler }[]>()

    const determineRoles = useCallback(() => {
        const roles = profileService
            .getProfileHandlers()
            .map((handler) => {
                const ruleId = handler.getEntityMapping().get(entity["@id"])
                if (ruleId) {
                    const rule = handler.getEntityRule(ruleId)
                    if (rule) return { rule, handler }
                } else return undefined
            })
            .filter((p) => p !== undefined)

        setRoles(roles)
    }, [entity, profileService])

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

    if (!roles) return null

    return roles.map((role) => (
        <Tooltip key={role.rule["@id"]}>
            <TooltipTrigger asChild>
                <Badge>
                    <BoxIcon />
                    {role.rule?.name || role.rule["@id"]}
                </Badge>
            </TooltipTrigger>
            <TooltipContent>
                <div className="max-w-96">
                    <div className="font-bold flex items-center">
                        <BoxIcon className="size-3 mr-1" /> Profile Insights
                    </div>
                    <div>Profile: {role.handler.getDefinition()?.name ?? role.handler.name}</div>
                    <div>Entity Type: {role.rule?.name || role.rule["@id"]}</div>
                    <br />
                    <div>Description:</div>
                    <MarkdownComment comment={role.rule.description} />
                </div>
            </TooltipContent>
        </Tooltip>
    ))
}
