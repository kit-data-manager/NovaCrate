import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import React, { PropsWithChildren } from "react"
import { useEditorState } from "@/lib/state/editor-state"
import { ValidationDrawer } from "@/components/validation-drawer"

export function NavDrawer({ children }: PropsWithChildren) {
    const showDrawer = useEditorState((s) => s.showValidationDrawer)

    if (showDrawer)
        return (
            <ResizablePanelGroup direction={"vertical"}>
                <ResizablePanel defaultSize={70}>{children}</ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={30}>
                    <ValidationDrawer />
                </ResizablePanel>
            </ResizablePanelGroup>
        )

    return children
}
