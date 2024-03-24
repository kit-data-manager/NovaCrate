import { NavHeader } from "@/components/nav-header"
import { NavSidebar } from "@/components/nav-sidebar"
import { PropsWithChildren } from "react"

export function Nav({ children }: PropsWithChildren<{}>) {
    return (
        <div className="flex flex-col w-full h-full">
            <NavHeader />
            <NavSidebar>{children}</NavSidebar>
        </div>
    )
}
