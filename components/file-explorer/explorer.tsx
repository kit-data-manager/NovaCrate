"use client"

import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { ChevronsDownUp, ChevronsUpDown, EllipsisVertical, Folder, RefreshCw } from "lucide-react"
import { Error } from "@/components/error"
import { FolderContent } from "@/components/file-explorer/content"
import HelpTooltip from "@/components/help-tooltip"
import { useFileExplorerState } from "@/lib/state/file-explorer-state"
import { Skeleton } from "@/components/ui/skeleton"
import { useEditorState } from "@/lib/state/editor-state"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu"
import { EntryContextMenu } from "@/components/file-explorer/entry-context-menu"
import { ActionButton } from "@/components/actions/action-buttons"
import { Button } from "@/components/ui/button"
import useSWR from "swr"
import { useStore } from "zustand/index"
import { fileExplorerSettings } from "@/lib/state/file-explorer-settings"
import { EntityIcon } from "@/components/entity/entity-icon"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export type DefaultSectionOpen = boolean | "indeterminate"

export function FileExplorer() {
    const crateData = useContext(CrateDataContext)
    const entities = useEditorState((store) => store.entities)
    const downloadError = useFileExplorerState((store) => store.downloadError)
    const showEntities = useStore(fileExplorerSettings, (s) => s.showEntities)
    const toggleShowEntities = useStore(fileExplorerSettings, (s) => s.toggleShowEntities)

    const filesListResolver = useCallback(async () => {
        if (crateData.serviceProvider && crateData.crateId) {
            return await crateData.serviceProvider.getCrateFilesList(crateData.crateId)
        }
    }, [crateData.crateId, crateData.serviceProvider])

    const {
        data,
        error,
        isLoading: isPending,
        mutate: revalidate
    } = useSWR(crateData.crateId ? "files-list-" + crateData.crateId : null, filesListResolver)

    const revalidateRef = useRef(revalidate)
    useEffect(() => {
        revalidateRef.current = revalidate
    }, [revalidate])

    useEffect(() => {
        revalidateRef.current()
    }, [entities])

    const [defaultSectionOpen, setDefaultSectionOpen] = useState<DefaultSectionOpen>(true)

    const collapseAllSections = useCallback(() => {
        setDefaultSectionOpen(false)
    }, [])

    const expandAllSections = useCallback(() => {
        setDefaultSectionOpen(true)
    }, [])

    const onSectionOpenChange = useCallback(() => {
        setDefaultSectionOpen("indeterminate")
    }, [])

    return (
        <div className="flex flex-col h-full bg-background rounded-lg overflow-hidden border">
            <div className="pl-4 pr-2 border-b text-sm h-10 flex items-center gap-2 truncate shrink-0 bg-accent">
                <Folder className="size-4 shrink-0" /> File Explorer
                <HelpTooltip>
                    <div>
                        <div className="text-wrap">
                            The File Explorer lists all files and folders in the RO-Crate.
                        </div>
                        <div className="mt-6">
                            <b>Double-Left-Click:</b> Edit/Create Data Entity
                        </div>
                        <div>
                            <b>Left-Click:</b> Preview File Content (only supported for some file
                            types)
                        </div>
                        <div>
                            <b>Right-Click:</b> More Options
                        </div>
                    </div>
                </HelpTooltip>
                <div className="grow" />
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className={`px-0`}
                            onClick={toggleShowEntities}
                        >
                            <EntityIcon
                                className={`ml-2  ${showEntities ? "" : "grayscale"}`}
                                entity={{ "@id": "", "@type": "File" }}
                            />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Show entities next to file names</TooltipContent>
                </Tooltip>
                <ActionButton
                    variant="outline"
                    className="text-xs"
                    size={"sm"}
                    noShortcut
                    actionId={"crate.add-entity"}
                />
                <DropdownMenu>
                    <DropdownMenuTrigger className="px-1" asChild>
                        <Button variant="outline" size="sm">
                            <EllipsisVertical className="size-4 shrink-0" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>File Explorer Settings</DropdownMenuLabel>
                        <DropdownMenuItem onClick={collapseAllSections}>
                            <ChevronsDownUp className={"size-4 mr-2"} /> Collapse All
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={expandAllSections}>
                            <ChevronsUpDown className={"size-4 mr-2"} /> Expand All
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled={isPending} onClick={() => revalidate()}>
                            <RefreshCw
                                className={`size-4 mr-2 ${isPending ? "animate-spin" : ""}`}
                            />{" "}
                            Reload
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <Error error={error} title="Failed to fetch files list" />
            <Error error={downloadError} title="Download failed" />
            <div className="p-2 overflow-y-auto grow">
                {!data ? (
                    <div className="flex flex-col gap-2">
                        {[0, 0, 0, 0, 0, 0].map((_, i) => {
                            return (
                                <Skeleton
                                    key={i}
                                    className={`w-96 h-8 ${i % 3 !== 0 ? "ml-10" : ""}`}
                                />
                            )
                        })}
                    </div>
                ) : (
                    <ContextMenu>
                        <ContextMenuTrigger>
                            <div className="w-full h-full">
                                <FolderContent
                                    filePaths={data}
                                    path={""}
                                    onSectionOpenChange={onSectionOpenChange}
                                    defaultSectionOpen={defaultSectionOpen}
                                />
                            </div>
                        </ContextMenuTrigger>
                        <EntryContextMenu blankSpace />
                    </ContextMenu>
                )}
            </div>
        </div>
    )
}
