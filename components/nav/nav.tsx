import { NavHeader } from "@/components/nav/nav-header"
import { NavSidebar } from "@/components/nav/nav-sidebar"
import { PropsWithChildren } from "react"

export function Nav({ children }: PropsWithChildren<{}>) {
    return (
        <div className="flex flex-col w-full h-full animate-fade-in">
            <NavHeader />
            <NavSidebar>{children}</NavSidebar>
        </div>
    )
}
