import { NavHeader } from "@/components/nav/nav-header"
import { NavSidebar } from "@/components/nav/nav-sidebar"
import { PropsWithChildren, useCallback, useContext, useEffect } from "react"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { Error } from "@/components/error"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"

export function Nav({ children }: PropsWithChildren<{}>) {
    const { error } = useContext(CrateDataContext)
    const { showGlobalSearchModal } = useContext(GlobalModalContext)

    const shortcutHandler = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "k" && e.ctrlKey) {
                e.preventDefault()
                showGlobalSearchModal()
            }
        },
        [showGlobalSearchModal]
    )

    useEffect(() => {
        window.addEventListener("keydown", shortcutHandler)

        return () => window.removeEventListener("keydown", shortcutHandler)
    }, [shortcutHandler])

    return (
        <div className="flex flex-col w-full h-full">
            <NavHeader />
            <Error title="An Error occured while loading the crate" error={error} />
            <NavSidebar>{children}</NavSidebar>
        </div>
    )
}
