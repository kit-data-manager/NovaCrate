"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    ArrowDownNarrowWide,
    ChevronsDownUp,
    ChevronsUpDown,
    EllipsisVertical,
    PackageSearch
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
import { ActionButton, ActionDropdownMenuItem } from "@/components/actions/action-buttons"
import { PropertyOverview } from "@/components/editor/property-overview"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { DefaultSectionOpen } from "@/components/entity-browser/entity-browser-section"
import { EntityBrowserContent } from "@/components/entity-browser/entity-browser-content"
import { ImperativePanelHandle } from "react-resizable-panels"

export function EntityBrowser() {
    const state = useEntityBrowserSettings()
    const [defaultSectionOpen, setDefaultSectionOpen] = useState<DefaultSectionOpen>(true)
    const showPropertyOverview = useEntityBrowserSettings((store) => store.showPropertyOverview)
    const propertyOverviewPanel = useRef<ImperativePanelHandle>(null)
    const sortBy = useEntityBrowserSettings((store) => store.sortBy)
    const structureBy = useEntityBrowserSettings((store) => store.structureBy)
    const setSortBy = useEntityBrowserSettings((store) => store.setSortBy)
    const setStructureBy = useEntityBrowserSettings((store) => store.setStructureBy)

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
                propertyOverviewPanel.current.expand(50)
            } else {
                propertyOverviewPanel.current.collapse()
            }
        }
    }, [showPropertyOverview])

    const entityBrowserPanel = useMemo(() => {
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

                    <ActionButton
                        actionId={"editor.global-search"}
                        variant={"outline"}
                        size={"sm"}
                        noShortcut
                        iconOnly
                    />

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
                                checked={state.showIdInsteadOfName}
                                onClick={() =>
                                    state.setShowIdInsteadOfName(!state.showIdInsteadOfName)
                                }
                            >
                                Show ID instead of Name
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={state.showPropertyOverview}
                                onClick={() =>
                                    state.setShowPropertyOverview(!state.showPropertyOverview)
                                }
                            >
                                Show Property Overview
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
        setSortBy,
        setStructureBy,
        sortBy,
        state,
        structureBy
    ])

    return (
        <ResizablePanelGroup direction={"vertical"}>
            <ResizablePanel defaultSize={100} minSize={10}>
                {entityBrowserPanel}
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={0} minSize={10} ref={propertyOverviewPanel} collapsible>
                <PropertyOverview />
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}
