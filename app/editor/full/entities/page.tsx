"use client"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { EntityBrowser } from "@/components/entity-browser"
import { EntityEditorTabs } from "@/components/editor/entity-editor-tabs"
import { createRef, useCallback } from "react"
import { ImperativePanelHandle } from "react-resizable-panels"
import { useCrateName } from "@/lib/hooks"
import { Metadata } from "@/components/Metadata"

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
                    <div className="h-full w-full overflow-auto">
                        <EntityEditorTabs toggleEntityBrowserPanel={toggleEntityBrowserPanel} />
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </>
    )
}
