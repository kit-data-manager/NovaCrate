import { useMemo } from "react"
import { isDataEntity, isFileDataEntity, isRootEntity } from "@/lib/utils"
import { Asterisk } from "lucide-react"

const entityBrowserItemIconBaseCN =
    "min-w-5 min-h-5 flex justify-center items-center border mr-2 rounded font-bold text-xs shrink-0"

export function EntityIcon(props: {
    entity?: IFlatEntity
    size?: "md" | "lg" | "sm"
    unsavedChanges?: boolean
}) {
    const sizeMod = useMemo(() => {
        return props.size == "lg"
            ? " min-w-7 min-h-7 rounded-lg"
            : props.size == "sm"
              ? " min-h-[18px] min-w-[18px] aspect-square ml-[-1px] mr-[7px]"
              : ""
    }, [props.size])

    if (!props.entity) {
        return (
            <div
                className={
                    entityBrowserItemIconBaseCN +
                    " border-muted-foreground text-muted-foreground" +
                    sizeMod
                }
            >
                <div
                    className={`absolute right-[-7px] top-[-7px] text-foreground text-xl bg-muted rounded-full ${props.unsavedChanges ? "" : "hidden"}`}
                >
                    <Asterisk className="w-4 h-4" />
                </div>
                <span>?</span>
            </div>
        )
    } else if (isRootEntity(props.entity)) {
        return (
            <div
                className={
                    entityBrowserItemIconBaseCN +
                    " relative text-background bg-root border-transparent dark:border-root dark:text-root dark:bg-transparent" +
                    sizeMod
                }
            >
                <div
                    className={`absolute right-[-7px] top-[-7px] text-foreground text-xl bg-muted rounded-full ${props.unsavedChanges ? "" : "hidden"}`}
                >
                    <Asterisk className="w-4 h-4" />
                </div>
                <span>R</span>
            </div>
        )
    } else if (isDataEntity(props.entity)) {
        return (
            <div
                className={
                    entityBrowserItemIconBaseCN +
                    " relative text-background bg-data border-transparent dark:border-data dark:text-data dark:bg-transparent" +
                    sizeMod
                }
            >
                <div
                    className={`absolute right-[-7px] top-[-7px] text-foreground text-xl bg-muted rounded-full ${props.unsavedChanges ? "" : "hidden"}`}
                >
                    <Asterisk className="w-4 h-4" />
                </div>
                <span>{isFileDataEntity(props.entity) ? "F" : "D"}</span>
            </div>
        )
    } else {
        return (
            <div
                className={
                    entityBrowserItemIconBaseCN +
                    " relative text-background bg-contextual border-transparent dark:border-contextual dark:text-contextual dark:bg-transparent" +
                    sizeMod
                }
            >
                <div
                    className={`absolute right-[-7px] top-[-7px] text-foreground text-xl bg-muted rounded-full ${props.unsavedChanges ? "" : "hidden"}`}
                >
                    <Asterisk className="w-4 h-4" />
                </div>
                <span>C</span>
            </div>
        )
    }
}
