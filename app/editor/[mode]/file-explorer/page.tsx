"use client"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { FileExplorer } from "@/components/file-explorer/explorer"
import { FilePreview } from "@/components/file-explorer/preview"
import { Metadata } from "@/components/Metadata"
import { useDefaultLayout } from "react-resizable-panels"

function Content() {
    const { defaultLayout, onLayoutChanged } = useDefaultLayout({
        id: "file-explorer"
    })

    return (
        <ResizablePanelGroup
            orientation="horizontal"
            defaultLayout={defaultLayout}
            onLayoutChanged={onLayoutChanged}
        >
            <ResizablePanel defaultSize={"34%"} minSize={"400px"}>
                <FileExplorer />
            </ResizablePanel>
            <ResizableHandle className="m-0.5" />
            <ResizablePanel defaultSize={"66%"} minSize={"400px"}>
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
