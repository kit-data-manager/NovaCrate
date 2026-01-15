import { NavHeader } from "@/components/nav/nav-header"
import { NavSidebar } from "@/components/nav/nav-sidebar"
import React, { PropsWithChildren } from "react"
import { NavDrawer } from "@/components/nav/nav-drawer"

export function Nav({ children }: PropsWithChildren) {
    return (
        <div className="flex flex-col w-full h-full animate-fade-in">
            <NavHeader />
            <NavSidebar>
                <NavDrawer>{children}</NavDrawer>
            </NavSidebar>
        </div>
    )
}
