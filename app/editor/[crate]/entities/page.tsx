"use client"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { EntityBrowser } from "@/components/entity-browser"
import { EntityEditorTabs } from "@/components/editor/entity-editor-tabs"
import { createRef, useCallback } from "react"
import { ImperativePanelHandle } from "react-resizable-panels"

export default function Entities() {
    const entityBrowserPanel = createRef<ImperativePanelHandle>()

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
        <ResizablePanelGroup direction={"horizontal"}>
            <ResizablePanel
                defaultSize={20}
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
            <ResizablePanel defaultSize={80} minSize={40}>
                <div className="h-full w-full overflow-auto">
                    <EntityEditorTabs toggleEntityBrowserPanel={toggleEntityBrowserPanel} />
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}
