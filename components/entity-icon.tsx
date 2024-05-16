import { useMemo } from "react"
import { isDataEntity, isRootEntity } from "@/lib/utils"

const entityBrowserItemIconBaseCN =
    "min-w-5 min-h-5 flex justify-center items-center border mr-2 rounded font-bold text-xs shrink-0"

export function EntityIcon(props: { entity?: IFlatEntity; size?: "md" | "lg" | "sm" }) {
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
                ?
            </div>
        )
    } else if (isRootEntity(props.entity)) {
        return (
            <div className={entityBrowserItemIconBaseCN + " border-root text-root" + sizeMod}>
                R
            </div>
        )
    } else if (isDataEntity(props.entity)) {
        return (
            <div className={entityBrowserItemIconBaseCN + " border-data text-data" + sizeMod}>
                D
            </div>
        )
    } else {
        return (
            <div
                className={
                    entityBrowserItemIconBaseCN + " border-contextual text-contextual" + sizeMod
                }
            >
                C
            </div>
        )
    }
}
