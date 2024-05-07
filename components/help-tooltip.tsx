import { PropsWithChildren } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { CircleHelp } from "lucide-react"

export default function HelpTooltip(props: PropsWithChildren) {
    return (
        <Tooltip delayDuration={200}>
            <TooltipTrigger>
                <CircleHelp className="w-4 h-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[600px]">{props.children}</TooltipContent>
        </Tooltip>
    )
}
