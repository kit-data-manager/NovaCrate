"use client"

import { useCallback, useContext } from "react"
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

export function FileExplorer() {
    const crateData = useContext(CrateDataContext)
    const { downloadError } = useContext(FileExplorerContext)

    const filesListResolver = useCallback(
        async (crateId: string) => {
            if (crateData.serviceProvider) {
                return await crateData.serviceProvider.getCrateFilesList(crateId)
            }
        },
        [crateData.serviceProvider]
    )

    const { data, error } = useAsync(crateData.crateId, filesListResolver)

    return (
        <div>
            <div className="pl-4 bg-accent text-sm h-10 flex items-center gap-2 truncate">
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
            <div className="flex gap-2 sticky top-0 z-10 p-2 bg-accent">
                <Button size="sm" variant="outline" className="text-xs">
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
                    disabled={crateData.crateDataIsLoading}
                >
                    <RefreshCw
                        className={`w-4 h-4 ${crateData.crateDataIsLoading ? "animate-spin" : ""}`}
                    />
                </Button>
            </div>
            <Error error={error} title="Failed to fetch files list" />
            <Error error={downloadError} title="Download failed" />
            <div className="p-2">
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
                    <FolderContent filePaths={data} path={""} />
                )}
            </div>
        </div>
    )
}
