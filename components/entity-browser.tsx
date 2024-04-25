"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { useCallback, useContext, useState } from "react"
import { CrateDataContext } from "@/components/crate-data-provider"
import { Button } from "@/components/ui/button"
import {
    getEntityDisplayName,
    isContextualEntity,
    isDataEntity,
    isRoCrateMetadataEntity,
    isRootEntity,
    toArray
} from "@/lib/utils"
import {
    ChevronDown,
    ChevronsDownUp,
    ChevronsUpDown,
    PackageSearch,
    Plus,
    RefreshCw
} from "lucide-react"
import { createEntityEditorTab, EntityEditorTabsContext } from "@/components/entity-tabs-provider"
import { EntityIcon } from "./entity-icon"
import { CrateEditorContext } from "@/components/crate-editor-provider"
import { GlobalModalContext } from "@/components/global-modals-provider"

export function EntityBrowserItem(props: { entity: IFlatEntity }) {
    const { openTab } = useContext(EntityEditorTabsContext)

    const openSelf = useCallback(() => {
        openTab(createEntityEditorTab(props.entity), true)
    }, [openTab, props.entity])

    return (
        <Button
            size="sm"
            variant="list-entry"
            className="group/entityBrowserItem"
            onClick={openSelf}
        >
            <EntityIcon entity={props.entity} />
            <div className="truncate">
                <span className="group-hover/entityBrowserItem:underline underline-offset-2">
                    {getEntityDisplayName(props.entity)}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                    {toArray(props.entity["@type"]).join(", ")}
                </span>
            </div>
        </Button>
    )
}

export function EntityBrowserSection(props: { section: "Data" | "Contextual" }) {
    const { entities } = useContext(CrateEditorContext)

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
                    className="w-5 h-5 mr-2 aria-disabled:-rotate-90 shrink-0"
                    aria-disabled={!open}
                />
                <div className="truncate mr-2">{props.section} Entities</div>
            </Button>
            {open ? (
                <div className="flex flex-col pl-4">
                    {entities
                        .filter((item) => !isRootEntity(item) && !isRoCrateMetadataEntity(item))
                        .filter((item) =>
                            props.section === "Data" ? isDataEntity(item) : isContextualEntity(item)
                        )
                        .map((item) => {
                            return <EntityBrowserItem entity={item} key={item["@id"]} />
                        })}
                </div>
            ) : null}
        </div>
    )
}

export function EntityBrowserContent() {
    const crate = useContext(CrateDataContext)
    const { entities } = useContext(CrateEditorContext)

    if (crate.crateDataIsLoading && !crate.crateData)
        return (
            <div className="flex flex-col gap-2 p-2">
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

    return (
        <div className="flex flex-col p-2">
            {entities
                .filter((item) => item["@id"] === "./")
                .map((item) => {
                    return <EntityBrowserItem entity={item} key={item["@id"]} />
                })}

            <EntityBrowserSection section={"Data"} />
            <EntityBrowserSection section={"Contextual"} />
        </div>
    )
}

export function EntityBrowser() {
    const crate = useContext(CrateDataContext)
    const { showCreateEntityModal } = useContext(GlobalModalContext)

    return (
        <div>
            <div className="pl-4 bg-accent text-sm h-10 flex items-center">
                <PackageSearch className="w-4 h-4 shrink-0 mr-2" /> Entity Explorer
            </div>
            <div className="flex gap-2 sticky top-0 z-10 p-2 bg-accent">
                <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => showCreateEntityModal()}
                >
                    <Plus className={"w-4 h-4"} />
                </Button>
                <Button size="sm" variant="outline" className="text-xs">
                    <ChevronsDownUp className={"w-4 h-4"} />
                </Button>
                <Button size="sm" variant="outline" className="text-xs">
                    <ChevronsUpDown className={"w-4 h-4"} />
                </Button>
                <div className="grow"></div>
                <Button
                    size="sm"
                    variant="outline"
                    className={`text-xs`}
                    disabled={crate.crateDataIsLoading}
                >
                    <RefreshCw
                        className={`w-4 h-4 ${crate.crateDataIsLoading ? "animate-spin" : ""}`}
                    />
                </Button>
            </div>
            <EntityBrowserContent />
        </div>
    )
}
