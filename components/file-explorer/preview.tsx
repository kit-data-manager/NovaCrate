"use client"

import { useMemo } from "react"
import { BaseViewer } from "@/components/file-explorer/viewers/base"
import { useFileExplorerState } from "@/lib/state/file-explorer-state"
import { FilePreviewTabs } from "@/components/file-explorer/file-preview-tabs"
import { FileIcon } from "lucide-react"

export function FilePreview() {
    const filePreviewTabs = useFileExplorerState((s) => s.filePreviewTabs)
    const activeFilePreviewTabPath = useFileExplorerState((s) => s.activeFilePreviewTabPath)

    const activeTab = useMemo(() => {
        return filePreviewTabs.find((tab) => tab.filePath === activeFilePreviewTabPath)
    }, [activeFilePreviewTabPath, filePreviewTabs])

    if (filePreviewTabs.length === 0)
        return (
            <div className="flex flex-col items-center justify-center h-full bg-background rounded-lg overflow-hidden border">
                <FileIcon className="w-52 h-52 mb-20 text-muted" />
                <div className="text-muted-foreground">
                    Select an File on the left to preview it here
                </div>
            </div>
        )

    return (
        <div className="flex flex-col h-full bg-background rounded-lg overflow-hidden border">
            <FilePreviewTabs />
            <div className="flex flex-col grow max-w-full overflow-none">
                {activeTab && <BaseViewer tab={activeTab} />}
            </div>
        </div>
    )
}
