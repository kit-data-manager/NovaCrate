"use client"

import { useMemo } from "react"
import { BaseViewer } from "@/components/file-explorer/viewers/base"
import { useFileExplorerState } from "@/lib/state/file-explorer-state"
import { FilePreviewTabs } from "@/components/file-explorer/file-preview-tabs"

export function FilePreview() {
    const filePreviewTabs = useFileExplorerState((s) => s.filePreviewTabs)
    const activeFilePreviewTabPath = useFileExplorerState((s) => s.activeFilePreviewTabPath)

    const activeTab = useMemo(() => {
        return filePreviewTabs.find((tab) => tab.filePath === activeFilePreviewTabPath)
    }, [activeFilePreviewTabPath, filePreviewTabs])

    return (
        <div className="flex flex-col h-full bg-background rounded-lg overflow-hidden border">
            <FilePreviewTabs />
            {activeTab ? <BaseViewer tab={activeTab} /> : <div>No tab is open</div>}
        </div>
    )
}
