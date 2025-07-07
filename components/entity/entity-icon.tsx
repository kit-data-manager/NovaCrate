import { useMemo } from "react"
import { cn, isDataEntity, isFileDataEntity, isRootEntity } from "@/lib/utils"
import { Asterisk } from "lucide-react"

const entityBrowserItemIconBaseCN =
    "min-w-5 min-h-5 inline-flex justify-center items-center border mr-2 rounded font-bold text-xs shrink-0 relative"

const asteriskCn = "absolute right-[-7px] top-[-7px] text-foreground text-xl rounded-full bg-muted"

const sizeCn = {
    md: "",
    lg: "min-w-7 min-h-7 rounded-lg",
    sm: "min-h-[18px] min-w-[18px] aspect-square ml-[-1px] mr-[7px]"
}

export function EntityIcon(props: {
    entity?: IEntity
    size?: "md" | "lg" | "sm"
    unsavedChanges?: boolean
    className?: string
}) {
    const content = useMemo(() => {
        if (!props.entity) return "?"
        else if (isRootEntity(props.entity)) return "R"
        else if (isDataEntity(props.entity)) return isFileDataEntity(props.entity) ? "F" : "D"
        else return "C"
    }, [props.entity])

    const baseColor = useMemo(() => {
        if (!props.entity) return "border-muted-foreground text-muted-foreground"
        else if (isRootEntity(props.entity)) return "border-root text-root"
        else if (isDataEntity(props.entity)) return "border-data text-data"
        else return "border-contextual text-contextual"
    }, [props.entity])

    return (
        <div
            className={cn(
                entityBrowserItemIconBaseCN,
                sizeCn[props.size || "md"],
                baseColor,
                props.className
            )}
        >
            <div className={cn(asteriskCn) + ` ${props.unsavedChanges ? "" : "hidden"}`}>
                <Asterisk className="size-4" />
            </div>
            <span>{content}</span>
        </div>
    )
}
