"use client"

import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { CrateDataContext } from "@/components/crate-data-provider"
import { useAsync } from "@/components/use-async"
import { Button } from "@/components/ui/button"
import {
    ChevronsDownUp,
    ChevronsUpDown,
    FileX,
    Folder,
    FolderX,
    Plus,
    RefreshCw
} from "lucide-react"
import { Error } from "@/components/error"
import { FolderContent } from "@/components/file-explorer/content"
import HelpTooltip from "@/components/help-tooltip"
import { FileExplorerContext } from "@/components/file-explorer/context"
import { Skeleton } from "@/components/ui/skeleton"
import { useEditorState } from "@/components/editor-state"

export type DefaultSectionOpen = boolean | "indeterminate"

export function FileExplorer() {
    const crateData = useContext(CrateDataContext)
    const entities = useEditorState.useEntities()
    const { downloadError } = useContext(FileExplorerContext)

    const filesListResolver = useCallback(
        async (crateId: string) => {
            if (crateData.serviceProvider) {
                return await crateData.serviceProvider.getCrateFilesList(crateId)
            }
        },
        [crateData.serviceProvider]
    )

    const { data, error, isPending, revalidate } = useAsync(crateData.crateId, filesListResolver)

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
        <div className="flex flex-col h-full">
            <div className="pl-4 bg-accent text-sm h-10 flex items-center gap-2 truncate shrink-0">
                <Folder className="w-4 h-4 shrink-0" /> File Explorer
                <HelpTooltip>
                    <div>
                        <div className="text-wrap">
                            The File Explorer lists all files and folders in the RO-Crate. Files
                            that are not described by a Data Entity are marked by{" "}
                            <FolderX className="inline-flex w-4 h-4 text-muted-foreground" />
                            {" or "}
                            <FileX className="inline-flex w-4 h-4 text-muted-foreground" />.
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
            </div>
            <div className="flex gap-2 sticky top-0 z-10 p-2 bg-accent shrink-0">
                <Button size="sm" variant="outline" className="text-xs">
                    <Plus className={"w-4 h-4"} />
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={collapseAllSections}
                >
                    <ChevronsDownUp className={"w-4 h-4"} />
                </Button>
                <Button size="sm" variant="outline" className="text-xs" onClick={expandAllSections}>
                    <ChevronsUpDown className={"w-4 h-4"} />
                </Button>
                <div className="grow"></div>
                <Button
                    size="sm"
                    variant="outline"
                    className={`text-xs`}
                    disabled={isPending}
                    onClick={revalidate}
                >
                    <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
                </Button>
            </div>
            <Error error={error} title="Failed to fetch files list" />
            <Error error={downloadError} title="Download failed" />
            <div className="p-2 overflow-y-auto">
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
                    <FolderContent
                        filePaths={data}
                        path={""}
                        onSectionOpenChange={onSectionOpenChange}
                        defaultSectionOpen={defaultSectionOpen}
                    />
                )}
            </div>
        </div>
    )
}
