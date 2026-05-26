import { IFilePreviewTab, useFileExplorerState, ViewerType } from "@/lib/state/file-explorer-state"
import { ImageViewer } from "@/components/file-explorer/viewers/image"
import { TextViewer } from "@/components/file-explorer/viewers/text"
import { ObjectViewer } from "@/components/file-explorer/viewers/object"
import { IFrameViewer } from "@/components/file-explorer/viewers/iframe"
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

export interface ViewerProps {
    tab: IFilePreviewTab
    data: Blob | undefined
}

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
            case ViewerType.IFRAME:
                return <IFrameViewer tab={tab} data={data} />
            case ViewerType.IMAGE:
                return <ImageViewer tab={tab} data={data} />
            case ViewerType.TEXT:
                return <TextViewer tab={tab} data={data} />
            case ViewerType.OBJECT:
                return <ObjectViewer tab={tab} data={data} />
        }
    }, [data, tab])

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
                            Text Viewer <ChevronDown className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem>Text iewe</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </>
    )
}
