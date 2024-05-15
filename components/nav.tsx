import { NavHeader } from "@/components/nav-header"
import { NavSidebar } from "@/components/nav-sidebar"
import { PropsWithChildren, useContext } from "react"
import { CrateDataContext } from "@/components/crate-data-provider"
import { Error } from "@/components/error"

export function Nav({ children }: PropsWithChildren<{}>) {
    const { error } = useContext(CrateDataContext)

    return (
        <div className="flex flex-col w-full h-full">
            <NavHeader />
            <Error title="An Error occured while loading the crate" error={error} />
            <NavSidebar>{children}</NavSidebar>
        </div>
    )
}
