"use client"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { FileExplorer } from "@/components/file-explorer/explorer"
import { createContext, useState } from "react"
import { FilePreview } from "@/components/file-explorer/preview"
import { FileExplorerContext } from "@/components/file-explorer/context"

export default function FileExplorerPage() {
    const [previewingFilePath, setPreviewingFilePath] = useState("")

    return (
        <div className="h-full">
            <FileExplorerContext.Provider
                value={{
                    previewingFilePath,
                    setPreviewingFilePath
                }}
            >
                <ResizablePanelGroup direction="horizontal">
                    <ResizablePanel defaultSize={67} minSize={15}>
                        <FileExplorer />
                    </ResizablePanel>
                    <ResizableHandle />
                    <ResizablePanel defaultSize={33} hidden={!previewingFilePath}>
                        <FilePreview />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </FileExplorerContext.Provider>
        </div>
    )
}
