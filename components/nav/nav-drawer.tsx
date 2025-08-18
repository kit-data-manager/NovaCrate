import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import React, { PropsWithChildren, useEffect, useRef } from "react"
import { useEditorState } from "@/lib/state/editor-state"
import { ValidationDrawer } from "@/components/validation-drawer"
import { ImperativePanelHandle } from "react-resizable-panels"

export function NavDrawer({ children }: PropsWithChildren) {
    const showDrawer = useEditorState((s) => s.showValidationDrawer)
    const ref = useRef<ImperativePanelHandle>(null)

    useEffect(() => {
        if (!ref.current) return
        if (showDrawer) {
            ref.current.expand(30)
        } else {
            ref.current.collapse()
        }
    }, [showDrawer])

    return (
        <ResizablePanelGroup direction={"vertical"}>
            <ResizablePanel defaultSize={100}>{children}</ResizablePanel>
            <ResizableHandle />
            <ResizablePanel collapsible ref={ref} defaultSize={0} minSize={10}>
                <ValidationDrawer />
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}
