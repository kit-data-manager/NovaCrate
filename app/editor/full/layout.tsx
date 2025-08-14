"use client"

import { memo, PropsWithChildren, useContext, useEffect } from "react"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { Nav } from "@/components/nav/nav"
import { usePathname } from "next/navigation"
import { SchemaWorkerProvider } from "@/components/providers/schema-worker-provider"
import { GlobalModalProvider } from "@/components/providers/global-modals-provider"
import { useCrateName, useRecentCrates } from "@/lib/hooks"
import { GraphStateProvider } from "@/components/providers/graph-state-provider"
import { GraphSettingsProvider } from "@/components/providers/graph-settings-provider"
import { ActionsProvider } from "@/components/providers/actions-provider"
import DefaultActions from "@/components/actions/default-actions"
import { ActionKeyboardShortcuts } from "@/components/actions/action-keyboard-shortcuts"
import EntityActions from "@/components/actions/entity-actions"
import { EntityEditorTabsSupervisor } from "@/components/editor/entity-editor-tabs-supervisor"
import { ValidationContextProvider } from "@/components/providers/validation-context"
import { CrateValidationSupervisor } from "@/components/crate-validation-supervisor"

export default function EditorLayout(props: PropsWithChildren) {
    return (
        <ActionsProvider>
            <SchemaWorkerProvider>
                <GlobalModalProvider>
                    <GraphStateProvider>
                        <GraphSettingsProvider>
                            <ValidationContextProvider>
                                <ProviderBoundary>{props.children}</ProviderBoundary>
                            </ValidationContextProvider>
                        </GraphSettingsProvider>
                    </GraphStateProvider>
                </GlobalModalProvider>
            </SchemaWorkerProvider>
        </ActionsProvider>
    )
}

/**
 * State changes in the providers (parent components) would normally trigger all child components (the entire editor) to
 * re-render, regardless of if their props changed or not. Therefore, we memoize here to prevent this effect.
 *
 * Children will still re-render as normal when their subscribed context or their props change.
 */
const ProviderBoundary = memo(function ProviderBoundary(props: PropsWithChildren) {
    return (
        <>
            <DefaultActions />
            <EntityActions />
            <ActionKeyboardShortcuts />
            <RecentlyUsed />
            <EntityEditorTabsSupervisor />
            <CrateValidationSupervisor />
            <Nav>{props.children}</Nav>
        </>
    )
})

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
