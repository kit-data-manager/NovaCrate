import { IFilePreviewTab, useFileExplorerState, ViewerType } from "@/lib/state/file-explorer-state"
import { ImageViewer } from "@/components/file-explorer/viewers/image"
import { TextViewer } from "@/components/file-explorer/viewers/text"
import { ObjectViewer } from "@/components/file-explorer/viewers/object"
import { IFrameViewer } from "@/components/file-explorer/viewers/iframe"
import { PreviewNotSupported } from "@/components/file-explorer/viewers/not-supported"
import { useCallback, useEffect, useMemo } from "react"
import { usePersistence } from "@/components/providers/persistence-provider"
import useSWR from "swr"
import { getFileAsURL } from "@/lib/core/util"
import { Error as ErrorDisplay } from "@/components/error"
import { determineViewerType } from "@/components/file-explorer/utils"

export interface ViewerProps {
    tab: IFilePreviewTab
    data: Blob | undefined
}

export function BaseViewer({ tab }: Omit<ViewerProps, "data">) {
    const persistence = usePersistence()
    const openTab = useFileExplorerState((s) => s.openTab)

    const resourceUrl = useMemo(() => {
        const fileService = persistence.getCrateService()?.getFileService()
        if (fileService) {
            return getFileAsURL(fileService, tab.filePath)
        } else return undefined
    }, [persistence, tab.filePath])

    const fileFetcher = useCallback(async (url: Promise<string>) => {
        const resolvedUrl = await url
        const req = await fetch(resolvedUrl)
        if (req.ok) {
            return await req.blob()
        } else {
            throw new Error("Failed to fetch file: " + req.statusText + " (" + req.status + ")")
        }
    }, [])

    const { data, error, isLoading } = useSWR(resourceUrl, fileFetcher)

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
                return <div>Identifying file type...</div>
            case ViewerType.UNSUPPORTED:
                return <PreviewNotSupported />
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
        <div>
            <ErrorDisplay title={"Could not load file for preview"} error={error} />
            {isLoading ? <div>Loading...</div> : Content}
        </div>
    )
}
