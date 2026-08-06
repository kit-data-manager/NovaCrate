"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    ArrowDownNarrowWide,
    ChevronsDownUp,
    ChevronsUpDown,
    EllipsisVertical,
    PackageSearch,
    TableOfContents
} from "lucide-react"
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
import { ActionButton } from "@/components/actions/action-buttons"
import { PropertyOverview } from "@/components/editor/property-overview"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { DefaultSectionOpen } from "@/components/entity-browser/entity-browser-section"
import { EntityBrowserContent } from "@/components/entity-browser/entity-browser-content"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useDefaultLayout, usePanelRef } from "react-resizable-panels"

export function EntityBrowser() {
    const state = useEntityBrowserSettings()
    const [defaultSectionOpen, setDefaultSectionOpen] = useState<DefaultSectionOpen>(true)
    const showPropertyOverview = useEntityBrowserSettings((store) => store.showPropertyOverview)
    const setShowPropertyOverview = useEntityBrowserSettings(
        (store) => store.setShowPropertyOverview
    )
    const propertyOverviewPanel = usePanelRef()
    const sortBy = useEntityBrowserSettings((store) => store.sortBy)
    const structureBy = useEntityBrowserSettings((store) => store.structureBy)
    const setSortBy = useEntityBrowserSettings((store) => store.setSortBy)
    const setStructureBy = useEntityBrowserSettings((store) => store.setStructureBy)

    const { defaultLayout, onLayoutChanged } = useDefaultLayout({
        id: "entit-browser-property-overview"
    })

    const collapseAllSections = useCallback(() => {
        setDefaultSectionOpen(false)
    }, [])

    const expandAllSections = useCallback(() => {
        setDefaultSectionOpen(true)
    }, [])

    const onSectionOpenChange = useCallback(() => {
        setDefaultSectionOpen("indeterminate")
    }, [])

    useEffect(() => {
        if (propertyOverviewPanel.current) {
            if (showPropertyOverview) {
                propertyOverviewPanel.current.expand()
            } else {
                propertyOverviewPanel.current.collapse()
            }
        }
    }, [propertyOverviewPanel, showPropertyOverview])

    const entityBrowserPanel = useMemo(() => {
        return (
            <div className="bg-background h-full w-full flex flex-col rounded-lg overflow-hidden border">
                <div className="pl-4 pr-2 gap-2 text-sm h-10 flex items-center shrink-0 bg-accent">
                    <PackageSearch className="size-4 shrink-0 mr-2" /> Entities
                    <div className="grow" />
                    <div className="flex gap-2 top-0 z-10 bg-accent overflow-x-auto no-scrollbar">
                        <Tooltip delayDuration={500}>
                            <TooltipTrigger asChild>
                                <ActionButton
                                    actionId="crate.add-entity"
                                    size="sm"
                                    variant="outline"
                                    className="text-xs"
                                    noShortcut
                                    hideName
                                    ignoreOnClickFromProps
                                />
                            </TooltipTrigger>
                            <TooltipContent>Create Entity</TooltipContent>
                        </Tooltip>
                        <Tooltip delayDuration={500}>
                            <TooltipTrigger asChild>
                                <ActionButton
                                    actionId={"editor.global-search"}
                                    variant={"outline"}
                                    size={"sm"}
                                    noShortcut
                                    iconOnly
                                    ignoreOnClickFromProps
                                />
                            </TooltipTrigger>
                            <TooltipContent>Global Search</TooltipContent>
                        </Tooltip>

                        <Tooltip delayDuration={500}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        state.setShowPropertyOverview(!state.showPropertyOverview)
                                    }
                                >
                                    <TableOfContents />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Toggle Property Overview</TooltipContent>
                        </Tooltip>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <ArrowDownNarrowWide className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                                <DropdownMenuCheckboxItem
                                    checked={sortBy === "name"}
                                    onClick={() => setSortBy("name")}
                                >
                                    Name
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={sortBy === "id"}
                                    onClick={() => setSortBy("id")}
                                >
                                    Identifier
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={sortBy === "type"}
                                    onClick={() => setSortBy("type")}
                                >
                                    Type
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Structure by</DropdownMenuLabel>
                                <DropdownMenuCheckboxItem
                                    checked={structureBy === "none"}
                                    onClick={() => setStructureBy("none")}
                                >
                                    None
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={structureBy === "general-type"}
                                    onClick={() => setStructureBy("general-type")}
                                >
                                    Category
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={structureBy === "@type"}
                                    onClick={() => setStructureBy("@type")}
                                >
                                    Type
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className={`text-xs`}>
                                    <EllipsisVertical className={`size-4`} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>Entity Explorer Settings</DropdownMenuLabel>
                                <DropdownMenuCheckboxItem
                                    checked={state.showEntityType}
                                    onClick={() => state.setShowEntityType(!state.showEntityType)}
                                >
                                    Show Entity Type
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={state.showEntityRules}
                                    onClick={() => state.setShowEntityRules(!state.showEntityRules)}
                                >
                                    Show Entity Rule
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
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
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
        setSortBy,
        setStructureBy,
        sortBy,
        state,
        structureBy
    ])

    return (
        <ResizablePanelGroup
            orientation={"vertical"}
            onLayoutChanged={onLayoutChanged}
            defaultLayout={defaultLayout}
        >
            <ResizablePanel defaultSize={"100%"} minSize={"200px"}>
                {entityBrowserPanel}
            </ResizablePanel>
            <ResizableHandle
                disabled={!showPropertyOverview}
                className={`${showPropertyOverview ? "" : "hidden"} m-0.5`}
            />
            <ResizablePanel
                defaultSize={"0%"}
                minSize={"200px"}
                panelRef={propertyOverviewPanel}
                collapsible
                onResize={(size) => {
                    if (size.asPercentage === 0) {
                        setShowPropertyOverview(false)
                    } else {
                        setShowPropertyOverview(true)
                    }
                }}
            >
                <PropertyOverview />
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}
