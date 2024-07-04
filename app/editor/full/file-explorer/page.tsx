"use client"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { FileExplorer } from "@/components/file-explorer/explorer"
import { FilePreview } from "@/components/file-explorer/preview"
import { Metadata } from "@/components/Metadata"
import { useFileExplorerState } from "@/lib/state/file-explorer-state"

function Content() {
    const { previewingFilePath, setPreviewingFilePath, setDownloadError } = useFileExplorerState()

    return (
        <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={34} minSize={15}>
                <FileExplorer />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={66} minSize={15}>
                <FilePreview
                    previewingFilePath={previewingFilePath}
                    setPreviewingFilePath={setPreviewingFilePath}
                    setDownloadError={setDownloadError}
                />
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}

export default function FileExplorerPage() {
    return (
        <div className="h-full">
            <Metadata page={"File Explorer"} />
            <Content />
        </div>
    )
}
