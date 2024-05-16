"use client"

import { FileX, Folder, FolderX, Eye, X, Pencil, Trash } from "lucide-react"
import HelpTooltip from "@/components/help-tooltip"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { FileExplorer } from "@/components/file-explorer/explorer"
import { useState } from "react"
import { FilePreview } from "@/components/file-explorer/preview"

export default function FileExplorerPage() {
    const [previewingFilePath, setPreviewingFilePath] = useState("")

    return (
        <div className="h-full">
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={67} minSize={15}>
                    <FileExplorer />
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={33}>
                    <FilePreview />
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}
