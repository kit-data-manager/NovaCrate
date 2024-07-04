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
    isFileDataEntity,
    isRoCrateMetadataEntity,
    isRootEntity,
    toArray
} from "@/lib/utils"
import {
    ChevronDown,
    ChevronsDownUp,
    ChevronsUpDown,
    EllipsisVertical,
    Eye,
    LayoutGrid,
    PackageSearch,
    Save,
    Trash,
    Undo2
} from "lucide-react"
import {
    createEntityEditorTab,
    EntityEditorTabsContext
} from "@/components/providers/entity-tabs-provider"
import { EntityIcon } from "./entity-icon"
import { useEditorState } from "@/lib/state/editor-state"
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
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger
} from "@/components/ui/context-menu"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"

type DefaultSectionOpen = boolean | "indeterminate"

export function EntityBrowserItem(props: { entityId: string }) {
    const showEntityType = useEntityBrowserSettings((store) => store.showEntityType)
    const showIdInsteadOfName = useEntityBrowserSettings((store) => store.showIdInsteadOfName)
    const { openTab, setPreviewingFilePath } = useContext(EntityEditorTabsContext)
    const entity = useEditorState((state) => state.entities.get(props.entityId))
    const { saveEntity } = useContext(CrateDataContext)
    const revertEntity = useEditorState.useRevertEntity()
    const { showDeleteEntityModal } = useContext(GlobalModalContext)
    const changeList = useEditorState((store) => store.getEntitiesChangelist())

    const canHavePreview = useMemo(() => {
        return entity ? isFileDataEntity(entity) : false
    }, [entity])

    const hasUnsavedChanges = useMemo(() => {
        return entity ? changeList.get(entity["@id"]) !== Diff.None : false
    }, [entity, changeList])

    const openSelf = useCallback(() => {
        if (!entity) return
        openTab(createEntityEditorTab(entity), true)
    }, [openTab, entity])

    const onSaveClick = useCallback(() => {
        if (entity) saveEntity(entity).then()
    }, [entity, saveEntity])

    const onRevertClick = useCallback(() => {
        if (entity) revertEntity(entity["@id"])
    }, [entity, revertEntity])

    const onDeleteClick = useCallback(() => {
        if (entity) showDeleteEntityModal(entity["@id"])
    }, [entity, showDeleteEntityModal])

    const onPreviewClick = useCallback(() => {
        if (entity) setPreviewingFilePath(entity["@id"])
    }, [entity, setPreviewingFilePath])

    if (!entity) return null

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
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
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={openSelf}>
                    <EntityIcon entity={entity} size="sm" /> Open Tab
                </ContextMenuItem>
                {canHavePreview ? (
                    <ContextMenuItem onClick={onPreviewClick}>
                        <Eye className="w-4 h-4 mr-2" /> Preview
                    </ContextMenuItem>
                ) : null}
                <ContextMenuSeparator />
                <ContextMenuItem onClick={onSaveClick} disabled={!hasUnsavedChanges}>
                    <Save className="w-4 h-4 mr-2" /> Save Entity
                </ContextMenuItem>
                <ContextMenuItem onClick={onRevertClick} disabled={!hasUnsavedChanges}>
                    <Undo2 className="w-4 h-4 mr-2" /> Revert Changes
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                    className="bg-destructive text-destructive-foreground"
                    onClick={onDeleteClick}
                >
                    <Trash className="w-4 h-4 mr-2" /> Delete
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}

export function EntityBrowserSection(props: {
    section: "Data" | "Contextual"
    defaultSectionOpen: DefaultSectionOpen
    onSectionOpenChange(): void
}) {
    const entities = useEditorState(
        (store) => {
            return Array.from(store.entities.entries())
                .map(([key, item]) => [key, item] as [string, IFlatEntity])
                .filter(([_, item]) => !isRootEntity(item) && !isRoCrateMetadataEntity(item))
                .filter(([_, item]) =>
                    props.section === "Data" ? isDataEntity(item) : isContextualEntity(item)
                )
                .sort((a, b) =>
                    getEntityDisplayName(a[1]).localeCompare(getEntityDisplayName(b[1]))
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
                    {entities.map(([key, _]) => {
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
        <div className="flex flex-col p-2 overflow-y-auto">
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
                    <PackageSearch className="w-4 h-4 shrink-0 mr-2" /> Entities
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
                                <LayoutGrid className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Toggle Property Overview</TooltipContent>
                    </Tooltip>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className={`text-xs`}>
                                <EllipsisVertical className={`w-4 h-4`} />
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
                                <ChevronsDownUp className={"w-4 h-4 mr-2"} /> Collapse All
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={expandAllSections}>
                                <ChevronsUpDown className={"w-4 h-4 mr-2"} /> Expand All
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
