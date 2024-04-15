import { useMemo } from "react"

const entityBrowserItemIconBaseCN =
    "min-w-5 min-h-5 flex justify-center items-center border mr-2  rounded font-bold text-xs"

export function EntityIcon(props: { entity: IFlatEntity; size?: "md" | "lg" }) {
    const sizeMod = useMemo(() => {
        return props.size == "lg" ? " min-w-7 min-h-7 rounded-lg" : ""
    }, [props.size])

    if (props.entity["@id"] === "./") {
        return (
            <div className={entityBrowserItemIconBaseCN + " border-root text-root" + sizeMod}>
                R
            </div>
        )
    } else if (props.entity["@type"] === "File") {
        return (
            <div className={entityBrowserItemIconBaseCN + " border-file text-file" + sizeMod}>
                F
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
