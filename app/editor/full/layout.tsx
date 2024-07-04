"use client"

import { PropsWithChildren, useContext, useEffect } from "react"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { Nav } from "@/components/nav/nav"
import { usePathname } from "next/navigation"
import { EntityEditorTabsProvider } from "@/components/providers/entity-tabs-provider"
import { CrateVerifyProvider } from "@/components/providers/crate-verify-provider"
import { GlobalModalProvider } from "@/components/providers/global-modals-provider"
import { useCrateName, useRecentCrates } from "@/lib/hooks"
import { GraphStateProvider } from "@/components/providers/graph-state-provider"
import { GraphSettingsProvider } from "@/components/providers/graph-settings-provider"
import { ActionsProvider } from "@/components/providers/actions-provider"
import DefaultActions from "@/components/actions/default-actions"
import { ActionKeyboardShortcuts } from "@/components/actions/action-keyboard-shortcuts"
import EntityActions from "@/components/actions/entity-actions"

export default function EditorLayout(props: PropsWithChildren) {
    return (
        <ActionsProvider>
            <CrateVerifyProvider>
                <EntityEditorTabsProvider>
                    <GlobalModalProvider>
                        <GraphStateProvider>
                            <GraphSettingsProvider>
                                <DefaultActions />
                                <EntityActions />
                                <ActionKeyboardShortcuts />
                                <RecentlyUsed />
                                <Nav>{props.children}</Nav>
                            </GraphSettingsProvider>
                        </GraphStateProvider>
                    </GlobalModalProvider>
                </EntityEditorTabsProvider>
            </CrateVerifyProvider>
        </ActionsProvider>
    )
}

function RecentlyUsed() {
    const pathname = usePathname()
    const { addRecentCrate } = useRecentCrates()
    const { crateId } = useContext(CrateDataContext)
    const crateName = useCrateName()

    useEffect(() => {
        if (crateId) addRecentCrate(crateId, crateName)
    }, [addRecentCrate, crateId, crateName, pathname])

    return null
}
