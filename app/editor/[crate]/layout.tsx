"use client"

import { PropsWithChildren, useEffect, useMemo } from "react"
import { CrateDataProvider } from "@/components/providers/crate-data-provider"
import { Nav } from "@/components/nav/nav"
import { RestProvider } from "@/lib/rest-provider"
import { usePathname } from "next/navigation"
import { EntityEditorTabsProvider } from "@/components/providers/entity-tabs-provider"
import { CrateVerifyProvider } from "@/components/providers/crate-verify-provider"
import { GlobalModalProvider } from "@/components/providers/global-modals-provider"
import { useCrateName, useRecentCrates } from "@/lib/hooks"
import { FileExplorerProvider } from "@/components/file-explorer/context"
import { GraphStateProvider } from "@/components/providers/graph-state-provider"
import { GraphSettingsProvider } from "@/components/providers/graph-settings-provider"

const CRATE_ID_REGEX = /^\/editor\/([^\/]*)\/.*$/

const serviceProvider = new RestProvider()

function getCrateId(pathname: string) {
    const matches = CRATE_ID_REGEX.exec(pathname)
    if (matches && matches.length > 1) {
        return matches[1]
    } else return undefined
}

export default function EditorLayout(props: PropsWithChildren) {
    const pathname = usePathname()

    const crateId = useMemo(() => {
        return getCrateId(pathname)
    }, [pathname])

    return (
        <CrateDataProvider serviceProvider={serviceProvider} crateId={crateId}>
            <CrateVerifyProvider>
                <EntityEditorTabsProvider>
                    <FileExplorerProvider>
                        <GlobalModalProvider>
                            <GraphStateProvider>
                                <GraphSettingsProvider>
                                    <RecentlyUsed />
                                    <Nav>{props.children}</Nav>
                                </GraphSettingsProvider>
                            </GraphStateProvider>
                        </GlobalModalProvider>
                    </FileExplorerProvider>
                </EntityEditorTabsProvider>
            </CrateVerifyProvider>
        </CrateDataProvider>
    )
}

function RecentlyUsed() {
    const pathname = usePathname()
    const { addRecentCrate } = useRecentCrates()

    const crateId = useMemo(() => {
        return getCrateId(pathname)
    }, [pathname])

    const crateName = useCrateName()

    useEffect(() => {
        if (crateId) addRecentCrate(crateId, crateName)
    }, [addRecentCrate, crateId, crateName, pathname])

    return null
}
