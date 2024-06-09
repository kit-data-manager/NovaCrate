"use client"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { FileExplorer } from "@/components/file-explorer/explorer"
import { useContext } from "react"
import { FilePreview } from "@/components/file-explorer/preview"
import { FileExplorerContext } from "@/components/file-explorer/context"
import { Metadata } from "@/components/Metadata"

function Content() {
    const { previewingFilePath } = useContext(FileExplorerContext)

    return (
        <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={50} minSize={15}>
                <FileExplorer />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={50} minSize={15} hidden={!previewingFilePath}>
                <FilePreview />
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
