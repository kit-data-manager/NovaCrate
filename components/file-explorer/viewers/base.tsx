import { IFilePreviewTab } from "@/lib/state/file-explorer-state"
import { useCallback, useEffect, useMemo } from "react"
import { usePersistence } from "@/components/providers/persistence-provider"
import useSWR from "swr"
import { Error as ErrorDisplay } from "@/components/error"
import { determineViewerType } from "@/components/file-explorer/utils"
import { ChevronDown, LoaderCircle } from "lucide-react"
import { LargeViewSelect } from "@/components/file-explorer/viewers/large-view-select"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { VIEWERS, ViewerType } from "@/lib/file-preview"
import { useFileService } from "@/lib/hooks/use-persistence"

export function BaseViewer({
    tab,
    updateTab
}: {
    tab: IFilePreviewTab
    updateTab: (tab: IFilePreviewTab) => void
}) {
    const persistence = usePersistence()

    const fileFetcher = useCallback(
        async (filePath: string) => {
            const fileService = persistence.getCrateService()?.getFileService()
            if (fileService) {
                return fileService.getFile(filePath)
            } else throw new Error("No file service available")
        },
        [persistence]
    )

    const { data, error, isLoading, mutate } = useSWR(tab.filePath, fileFetcher)

    useEffect(() => {
        if (data && tab.viewerType === ViewerType.NOT_IDENTIFIED_YET) {
            updateTab({
                ...tab,
                viewerType: determineViewerType(data)
            })
        }
    }, [data, updateTab, tab])

    const fileService = useFileService()

    useEffect(() => {
        if (fileService) {
            const remove = fileService.events.addEventListener("file-updated", (path) => {
                if (path === tab.filePath) {
                    mutate().then()
                }
            })

            return () => {
                remove()
            }
        }
    }, [fileService, mutate, tab.filePath])

    const setType = useCallback(
        (type: ViewerType) => {
            updateTab({
                ...tab,
                viewerType: type
            })
        },
        [tab, updateTab]
    )

    const Content = useMemo(() => {
        switch (tab.viewerType) {
            case ViewerType.NOT_IDENTIFIED_YET:
                return (
                    <div className="flex justify-center items-center h-full">
                        <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
                    </div>
                )
            case ViewerType.UNKNOWN:
                return <LargeViewSelect setType={setType} />
            default:
                const Viewer = VIEWERS.find((v) => v.type === tab.viewerType)!.component
                return <Viewer data={data} tab={tab} updateTab={updateTab} />
        }
    }, [data, setType, tab, updateTab])

    return (
        <>
            <ErrorDisplay title={"Could not load file for preview"} error={error} />
            {isLoading ? (
                <div className="flex justify-center items-center h-full">
                    <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grow">{Content}</div>
            )}
            <div className="flex justify-between items-center bg-muted/50 text-sm text-muted-foreground px-2">
                <div className="truncate">Path: {tab.filePath}</div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-sm font-normal">
                            {VIEWERS.find((v) => v.type === tab.viewerType)?.displayName ??
                                "Select Viewer"}
                            <ChevronDown className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {VIEWERS.map((v) => (
                            <DropdownMenuItem
                                key={v.type}
                                onClick={() => {
                                    setType(v.type)
                                }}
                            >
                                {v.displayName}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </>
    )
}
