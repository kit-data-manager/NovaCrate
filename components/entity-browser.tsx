"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { useCallback, useContext, useState } from "react"
import { CrateDataContext, ICrateDataProvider } from "@/components/crate-data-provider"
import { Button } from "@/components/ui/button"
import { toArray } from "@/lib/utils"
import { ChevronDown, ChevronsDownUp, ChevronsUpDown, Plus, RefreshCw } from "lucide-react"

const entityBrowserItemIconBaseCN =
    "min-w-5 min-h-5 flex justify-center items-center border mr-2  rounded font-bold text-xs"
export function EntityBrowserItemIcon(props: { entity: IFlatEntity }) {
    if (props.entity["@id"] === "./") {
        return <div className={entityBrowserItemIconBaseCN + " border-root text-root"}>D</div>
    } else if (props.entity["@type"] === "File") {
        return <div className={entityBrowserItemIconBaseCN + " border-file text-file"}>F</div>
    } else {
        return (
            <div className={entityBrowserItemIconBaseCN + " border-contextual text-contextual"}>
                {toArray(props.entity["@type"])[0][0]}
            </div>
        )
    }
}

export function EntityBrowserItem(props: { entity: IFlatEntity }) {
    return (
        <Button size="sm" variant="list-entry" className="group/entityBrowserItem">
            <EntityBrowserItemIcon entity={props.entity} />
            <span className="group-hover/entityBrowserItem:underline underline-offset-2 truncate">
                {props.entity.name.toString() || props.entity["@id"]}
            </span>
            <span className="ml-2 text-xs text-muted-foreground">{props.entity["@type"]}</span>
        </Button>
    )
}

export function EntityBrowserSection(props: { crate: ICrate; section: "File" | "Contextual" }) {
    const [open, setOpen] = useState(true)

    const toggle = useCallback(() => {
        setOpen(!open)
    }, [open])

    return (
        <div>
            <Button
                size="sm"
                variant="list-entry"
                className="hover:underline underline-offset-2 w-full"
                onClick={toggle}
            >
                <ChevronDown
                    className="w-5 h-5 mr-2 aria-disabled:-rotate-90"
                    aria-disabled={!open}
                />
                <div className="truncate">{props.section} Entities</div>
            </Button>
            {open ? (
                <div className="flex flex-col pl-4">
                    {props.crate["@graph"]
                        .filter((item) =>
                            props.section === "File"
                                ? toArray(item["@type"]).includes("File")
                                : !toArray(item["@type"]).includes("File") && item["@id"] !== "./"
                        )
                        .map((item) => {
                            return <EntityBrowserItem entity={item} key={item["@id"]} />
                        })}
                </div>
            ) : null}
        </div>
    )
}

export function EntityBrowserContent(props: { crate: ICrateDataProvider }) {
    const { crate } = props

    if (crate.crateDataIsLoading)
        return (
            <div className="flex flex-col gap-2">
                <Skeleton className="h-6 w-60" />
                <Skeleton className="h-6 w-60 ml-6" />
                <Skeleton className="h-6 w-60 ml-6" />
                <Skeleton className="h-6 w-60" />
                <Skeleton className="h-6 w-60 ml-6" />
                <Skeleton className="h-6 w-60 ml-6" />
                <Skeleton className="h-6 w-60" />
                <Skeleton className="h-6 w-60 ml-6" />
                <Skeleton className="h-6 w-60 ml-6" />
            </div>
        )

    if (!crate.crateData) return <div>No Data</div>

    return (
        <div className="flex flex-col p-2">
            {crate.crateData["@graph"]
                .filter((item) => item["@id"] === "./")
                .map((item) => {
                    return <EntityBrowserItem entity={item} key={item["@id"]} />
                })}

            <EntityBrowserSection crate={crate.crateData} section={"File"} />
            <EntityBrowserSection crate={crate.crateData} section={"Contextual"} />
        </div>
    )
}

export function EntityBrowser() {
    const crate = useContext(CrateDataContext)

    return (
        <div>
            <div className="flex gap-2 sticky top-0 z-10 p-2 bg-primary-foreground">
                <Button size="sm" variant="secondary" className="text-xs">
                    <Plus className={"w-4 h-4"} />
                </Button>
                <Button size="sm" variant="secondary" className="text-xs">
                    <ChevronsDownUp className={"w-4 h-4"} />
                </Button>
                <Button size="sm" variant="secondary" className="text-xs">
                    <ChevronsUpDown className={"w-4 h-4"} />
                </Button>
                <div className="grow"></div>
                <Button size="sm" variant="secondary" className="text-xs">
                    <RefreshCw className="w-4 h-4" />
                </Button>
            </div>
            <EntityBrowserContent crate={crate} />
        </div>
    )
}
