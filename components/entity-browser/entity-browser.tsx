"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    ChevronsDownUp,
    ChevronsUpDown,
    EllipsisVertical,
    LayoutGrid,
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DefaultSectionOpen } from "@/components/entity-browser/entity-browser-section"
import { EntityBrowserContent } from "@/components/entity-browser/entity-browser-content"

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
