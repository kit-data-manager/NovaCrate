import { useFileExplorerState } from "@/lib/state/file-explorer-state"
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
import { ViewerProps, VIEWERS, ViewerType } from "@/lib/file-preview"

export function BaseViewer({ tab }: Omit<ViewerProps, "data">) {
    const persistence = usePersistence()
    const openTab = useFileExplorerState((s) => s.openTab)

    const fileFetcher = useCallback(
        async (filePath: string) => {
            const fileService = persistence.getCrateService()?.getFileService()
            if (fileService) {
                return fileService.getFile(filePath)
            } else throw new Error("No file service available")
        },
        [persistence]
    )

    const { data, error, isLoading } = useSWR(tab.filePath, fileFetcher)

    useEffect(() => {
        if (data && tab.viewerType === ViewerType.NOT_IDENTIFIED_YET) {
            openTab({
                ...tab,
                viewerType: determineViewerType(data)
            })
        }
    }, [data, openTab, tab])

    const Content = useMemo(() => {
        switch (tab.viewerType) {
            case ViewerType.NOT_IDENTIFIED_YET:
                return (
                    <div className="flex justify-center items-center h-full">
                        <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
                    </div>
                )
            case ViewerType.UNKNOWN:
                return <LargeViewSelect />
            default:
                const Viewer = VIEWERS.find((v) => v.type === tab.viewerType)!.component
                return <Viewer data={data} tab={tab} />
        }
    }, [data, tab])

    const setTabType = useCallback(
        (type: ViewerType) => {
            const activeTabPath = useFileExplorerState.getState().activeFilePreviewTabPath
            const activeTab = useFileExplorerState
                .getState()
                .filePreviewTabs.find((tab) => tab.filePath === activeTabPath)
            if (!activeTab) return
            openTab(
                {
                    ...activeTab,
                    viewerType: type
                },
                true
            )
        },
        [openTab]
    )

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
                                    setTabType(v.type)
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
