"use client"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { EntityBrowser } from "@/components/entity-browser"
import { EntityEditorTabs } from "@/components/editor/entity-editor-tabs"
import { createRef, PropsWithChildren, useCallback, useContext } from "react"
import { ImperativePanelHandle } from "react-resizable-panels"
import { Metadata } from "@/components/Metadata"
import { FilePreview } from "@/components/file-explorer/preview"
import { FileExplorerContext } from "@/components/file-explorer/context"

function EntityEditorFilePreview(props: PropsWithChildren) {
    return (
        <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={66} minSize={20}>
                <div className="h-full w-full overflow-auto">{props.children}</div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={34} minSize={20}>
                <div className="h-full w-full overflow-auto">
                    <FilePreview doubleHeight={true} />
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}

export default function Entities() {
    const entityBrowserPanel = createRef<ImperativePanelHandle>()
    const { previewingFilePath } = useContext(FileExplorerContext)

    const toggleEntityBrowserPanel = useCallback(() => {
        if (entityBrowserPanel.current) {
            if (entityBrowserPanel.current.isExpanded()) {
                entityBrowserPanel.current.collapse()
            } else {
                entityBrowserPanel.current.expand()
            }
        }
    }, [entityBrowserPanel])

    return (
        <>
            <Metadata page={"Entities"} />
            <ResizablePanelGroup direction={"horizontal"}>
                <ResizablePanel
                    defaultSize={30}
                    minSize={10}
                    ref={entityBrowserPanel}
                    collapsible
                    collapsedSize={0}
                >
                    <div className="h-full w-full overflow-auto">
                        <EntityBrowser />
                    </div>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={70} minSize={30}>
                    {previewingFilePath ? (
                        <EntityEditorFilePreview>
                            <EntityEditorTabs toggleEntityBrowserPanel={toggleEntityBrowserPanel} />
                        </EntityEditorFilePreview>
                    ) : (
                        <EntityEditorTabs toggleEntityBrowserPanel={toggleEntityBrowserPanel} />
                    )}
                </ResizablePanel>
            </ResizablePanelGroup>
        </>
    )
}
