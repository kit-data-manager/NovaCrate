import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import React, { PropsWithChildren, useEffect } from "react"
import { ValidationDrawer } from "@/components/validation-drawer"
import { useLayoutState } from "@/lib/state/layout-state"
import { usePanelRef } from "react-resizable-panels"

export function NavDrawer({ children }: PropsWithChildren) {
    const showDrawer = useLayoutState((s) => s.showValidationDrawer)
    const setShowDrawer = useLayoutState((s) => s.setShowValidationDrawer)
    const ref = usePanelRef()

    useEffect(() => {
        if (!ref.current) return
        if (showDrawer) {
            ref.current.expand()
        } else {
            ref.current.collapse()
        }
    }, [ref, showDrawer])

    return (
        <ResizablePanelGroup orientation={"vertical"}>
            <ResizablePanel defaultSize={"100%"}>{children}</ResizablePanel>
            <ResizableHandle className="m-0.5" />
            <ResizablePanel
                collapsible
                panelRef={ref}
                defaultSize={"0%"}
                minSize={"200px"}
                onResize={(size) => {
                    if (size.asPercentage === 0) {
                        setShowDrawer(false)
                    } else {
                        setShowDrawer(true)
                    }
                }}
            >
                <ValidationDrawer />
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}
