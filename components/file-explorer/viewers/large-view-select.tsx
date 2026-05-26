import { Button } from "@/components/ui/button"
import { useFileExplorerState, ViewerType } from "@/lib/state/file-explorer-state"
import { ArrowRight } from "lucide-react"
import { useCallback } from "react"

export function ViewSelectButton({ label, type }: { label: string; type: ViewerType }) {
    const openTab = useFileExplorerState((s) => s.openTab)

    const setType = useCallback(() => {
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
    }, [openTab, type])

    return (
        <Button
            className="w-sm rounded-none first:rounded-t-lg last:rounded-b-lg border-b-0 last:border-b flex justify-between"
            variant="outline"
            onClick={setType}
        >
            {label}
            <ArrowRight className="size-4" />
        </Button>
    )
}

export function LargeViewSelect() {
    return (
        <div className="flex flex-col items-center justify-center gap-8 h-full bg-background">
            How do you want to view this file?
            <div className="flex flex-col items-center">
                <ViewSelectButton label={"Text Viewer"} type={ViewerType.TEXT} />
                <ViewSelectButton label={"Image Viewer"} type={ViewerType.IMAGE} />
                <ViewSelectButton label={"HTML Viewer"} type={ViewerType.IFRAME} />
                <ViewSelectButton label={"Object Viewer (e.g. PDF)"} type={ViewerType.OBJECT} />
            </div>
            <div className="text-sm text-muted-foreground">
                You can always change this using the menu that will appear at the bottom
            </div>
        </div>
    )
}
