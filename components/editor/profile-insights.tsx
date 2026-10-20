import { Badge } from "@/components/ui/badge"
import { BoxIcon, Library } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { MarkdownComment } from "@/components/markdown-comment"
import { useActiveEntityRules } from "@/lib/hooks/use-profile-service"

export function ProfileInsights({ entity }: { entity: IEntity }) {
    const roles = useActiveEntityRules(entity["@id"])

    if (!roles) return null

    return (
        <div className="flex items-center gap-1">
            {roles.map((role) => (
                <Tooltip key={role.rule["@id"]} delayDuration={100}>
                    <TooltipTrigger asChild>
                        <Badge variant="secondary">
                            <Library />
                            {role.rule?.name || role.rule["@id"]}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <div className="max-w-96">
                            <div className="font-bold flex items-center">
                                <BoxIcon className="size-3 mr-1" /> Profile Insights
                            </div>
                            <div>
                                Profile: {role.handler.getDefinition()?.name ?? role.handler.name}
                            </div>
                            <div>Entity Type: {role.rule?.name || role.rule["@id"]}</div>
                            <br />
                            <div>Description:</div>
                            <MarkdownComment comment={role.rule.description} />
                        </div>
                    </TooltipContent>
                </Tooltip>
            ))}
        </div>
    )
}
