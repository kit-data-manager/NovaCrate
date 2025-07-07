"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { Button } from "@/components/ui/button"
import {
    Diff,
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
    EllipsisVertical,
    LayoutGrid,
    PackageSearch
} from "lucide-react"
import { createEntityEditorTab, useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"
import { EntityIcon } from "./entity/entity-icon"
import { editorState, useEditorState } from "@/lib/state/editor-state"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useEntityBrowserSettings } from "@/lib/state/entity-browser-settings"
import { ActionButton, ActionDropdownMenuItem } from "@/components/actions/action-buttons"
import { PropertyOverview } from "@/components/editor/property-overview"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useStoreWithEqualityFn } from "zustand/traditional"
import { EntityContextMenu } from "@/components/entity/entity-context-menu"

type DefaultSectionOpen = boolean | "indeterminate"

export function EntityBrowserItem(props: { entityId: string }) {
    const showEntityType = useEntityBrowserSettings((store) => store.showEntityType)
    const showIdInsteadOfName = useEntityBrowserSettings((store) => store.showIdInsteadOfName)
    const openTab = useEntityEditorTabs((store) => store.openTab)
    const entity = useEditorState((state) => state.entities.get(props.entityId))
    const diff = useEditorState((state) => state.getEntityDiff(props.entityId))

    const hasUnsavedChanges = useMemo(() => {
        return entity ? diff !== Diff.None : false
    }, [diff, entity])

    const openSelf = useCallback(() => {
        if (!entity) return
        openTab(createEntityEditorTab(entity), true)
    }, [openTab, entity])

    if (!entity) {
        console.warn(
            "EntityBrowserItem could not be rendered because the entity does not exist:",
            props.entityId
        )
        return null
    }

    return (
        <EntityContextMenu entity={entity} asChild>
            <Button
                size="sm"
                variant="list-entry"
                className="group/entityBrowserItem shrink-0"
                onClick={openSelf}
            >
                <EntityIcon entity={entity} unsavedChanges={hasUnsavedChanges} />
                <div className="truncate">
                    <span className="group-hover/entityBrowserItem:underline underline-offset-2">
                        {showIdInsteadOfName ? props.entityId : getEntityDisplayName(entity)}
                    </span>
                    {showEntityType ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                            {toArray(entity["@type"]).join(", ")}
                        </span>
                    ) : null}
                </div>
            </Button>
        </EntityContextMenu>
    )
}

export function EntityBrowserSection(props: {
    section: "Data" | "Contextual"
    defaultSectionOpen: DefaultSectionOpen
    onSectionOpenChange(): void
}) {
    const entities = useStoreWithEqualityFn(
        editorState,
        (store) => {
            return Array.from(store.entities.entries())
                .map(([key, item]) => [key, item] as [string, IEntity])
                .filter(([, item]) => !isRootEntity(item) && !isRoCrateMetadataEntity(item))
                .filter(([, item]) =>
                    props.section === "Data" ? isDataEntity(item) : isContextualEntity(item)
                )
                .sort((a, b) =>
                    getEntityDisplayName(a[1]).localeCompare(getEntityDisplayName(b[1]))
                )
        },
        (a, b) => {
            if (a.length !== b.length) return false
            for (let i = 0; i < a.length; i++) {
                if (a[i][0] !== b[i][0] || a[i][1] !== b[i][1]) return false
            }
            return true
        }
    )

    const [open, setOpen] = useState(
        props.defaultSectionOpen !== "indeterminate" ? props.defaultSectionOpen : true
    )

    useEffect(() => {
        if (props.defaultSectionOpen !== "indeterminate") setOpen(props.defaultSectionOpen)
    }, [props.defaultSectionOpen])

    const toggle = useCallback(() => {
        setOpen(!open)
        props.onSectionOpenChange()
    }, [open, props])

    return (
        <div className="shrink-0">
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
                    {entities.map(([key]) => {
                        return <EntityBrowserItem entityId={key} key={key} />
                    })}
                </div>
            ) : null}
        </div>
    )
}

export function EntityBrowserContent({
    defaultSectionOpen,
    onSectionOpenChange
}: {
    defaultSectionOpen: DefaultSectionOpen
    onSectionOpenChange(): void
}) {
    const crate = useContext(CrateDataContext)

    if (!crate.crateData)
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
        <div id="entity-browser-content" className="flex flex-col p-2 overflow-y-auto">
            <EntityBrowserItem entityId={"./"} />
            <EntityBrowserSection
                section={"Data"}
                defaultSectionOpen={defaultSectionOpen}
                onSectionOpenChange={onSectionOpenChange}
            />
            <EntityBrowserSection
                section={"Contextual"}
                defaultSectionOpen={defaultSectionOpen}
                onSectionOpenChange={onSectionOpenChange}
            />
        </div>
    )
}

export function EntityBrowser() {
    const state = useEntityBrowserSettings()
    const [defaultSectionOpen, setDefaultSectionOpen] = useState<DefaultSectionOpen>(true)
    const showPropertyOverview = useEntityBrowserSettings((store) => store.showPropertyOverview)
    const setShowPropertyOverview = useEntityBrowserSettings(
        (store) => store.setShowPropertyOverview
    )

    const collapseAllSections = useCallback(() => {
        setDefaultSectionOpen(false)
    }, [])

    const expandAllSections = useCallback(() => {
        setDefaultSectionOpen(true)
    }, [])

    const onSectionOpenChange = useCallback(() => {
        setDefaultSectionOpen("indeterminate")
    }, [])

    const togglePropertyOverview = useCallback(() => {
        setShowPropertyOverview(!showPropertyOverview)
    }, [setShowPropertyOverview, showPropertyOverview])

    const EntityBrowserPanel = useCallback(() => {
        return (
            <div className="h-full w-full flex flex-col">
                <div className="pl-4 bg-accent text-sm h-10 flex items-center shrink-0">
                    <PackageSearch className="size-4 shrink-0 mr-2" /> Entities
                </div>
                <div className="flex gap-2 top-0 z-10 p-2 bg-accent shrink-0">
                    <ActionButton
                        actionId="crate.add-entity"
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        noShortcut
                    />
                    <div className="grow"></div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" onClick={togglePropertyOverview}>
                                <LayoutGrid className="size-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Toggle Property Overview</TooltipContent>
                    </Tooltip>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className={`text-xs`}>
                                <EllipsisVertical className={`size-4`} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Entity Explorer Settings</DropdownMenuLabel>
                            {/*<DropdownMenuCheckboxItem*/}
                            {/*    checked={state.showFolderStructure}*/}
                            {/*    onClick={() => state.setShowFolderStructure(!state.showFolderStructure)}*/}
                            {/*>*/}
                            {/*    Show Folder Structure*/}
                            {/*</DropdownMenuCheckboxItem>*/}
                            <DropdownMenuCheckboxItem
                                checked={state.showEntityType}
                                onClick={() => state.setShowEntityType(!state.showEntityType)}
                            >
                                Show Entity Type
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={state.showIdInsteadOfName}
                                onClick={() =>
                                    state.setShowIdInsteadOfName(!state.showIdInsteadOfName)
                                }
                            >
                                Show ID instead of Name
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={collapseAllSections}>
                                <ChevronsDownUp className={"size-4 mr-2"} /> Collapse All
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={expandAllSections}>
                                <ChevronsUpDown className={"size-4 mr-2"} /> Expand All
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <ActionDropdownMenuItem actionId={"crate.reload-entities"} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <EntityBrowserContent
                    defaultSectionOpen={defaultSectionOpen}
                    onSectionOpenChange={onSectionOpenChange}
                />
            </div>
        )
    }, [
        collapseAllSections,
        defaultSectionOpen,
        expandAllSections,
        onSectionOpenChange,
        state,
        togglePropertyOverview
    ])

    if (!showPropertyOverview) return <EntityBrowserPanel />

    return (
        <ResizablePanelGroup direction={"vertical"}>
            <ResizablePanel defaultSize={60} minSize={10}>
                <EntityBrowserPanel />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={40} minSize={5}>
                <PropertyOverview />
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}
