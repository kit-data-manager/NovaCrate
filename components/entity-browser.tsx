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
import { GlobalModalContext } from "@/components/global-modals-provider"
import { useEditorState } from "@/components/editor-state"

export function EntityBrowserItem(props: { entityId: string }) {
    const { openTab } = useContext(EntityEditorTabsContext)
    const entity = useEditorState((state) => state.entities.get(props.entityId))

    const openSelf = useCallback(() => {
        if (!entity) return
        openTab(createEntityEditorTab(entity), true)
    }, [openTab, entity])

    if (!entity) return null

    return (
        <Button
            size="sm"
            variant="list-entry"
            className="group/entityBrowserItem"
            onClick={openSelf}
        >
            <EntityIcon entity={entity} />
            <div className="truncate">
                <span className="group-hover/entityBrowserItem:underline underline-offset-2">
                    {getEntityDisplayName(entity)}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                    {toArray(entity["@type"]).join(", ")}
                </span>
            </div>
        </Button>
    )
}

export function EntityBrowserSection(props: { section: "Data" | "Contextual" }) {
    const entities = useEditorState(
        (store) => {
            return Array.from(store.entities.entries())
                .map(
                    ([key, item]) =>
                        [key, { "@id": item["@id"], "@type": item["@type"] }] as [
                            string,
                            IFlatEntity
                        ]
                )
                .filter(([_, item]) => !isRootEntity(item) && !isRoCrateMetadataEntity(item))
                .filter(([_, item]) =>
                    props.section === "Data" ? isDataEntity(item) : isContextualEntity(item)
                )
        },
        (a, b) => {
            if (a.length !== b.length) return false
            a.forEach((self, i) => {
                if (self[0] !== b[i][0] || self[1] !== b[i][1]) return false
            })
            return true
        }
    )

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
                    {entities.map(([key, _]) => {
                        return <EntityBrowserItem entityId={key} key={key} />
                    })}
                </div>
            ) : null}
        </div>
    )
}

export function EntityBrowserContent() {
    const crate = useContext(CrateDataContext)

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
            <EntityBrowserItem entityId={"./"} />
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
                    onClick={() => crate.reload()}
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
