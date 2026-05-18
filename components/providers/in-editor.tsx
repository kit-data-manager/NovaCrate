"use client"

import { memo, PropsWithChildren, useEffect } from "react"
import { usePersistence, useSetPersistence } from "@/components/providers/persistence-provider"
import { IFrameMessenger } from "@/components/iframe-messenger"
import { CoreProvider } from "@/components/providers/core-provider"
import { SchemaWorkerProvider } from "@/components/providers/schema-worker-provider"
import { GlobalModalProvider } from "@/components/providers/global-modals-provider"
import { ValidationContextProvider } from "@/components/providers/validation-context"
import DefaultActions from "@/components/actions/default-actions"
import EntityActions from "@/components/actions/entity-actions"
import { ActionKeyboardShortcuts } from "@/components/actions/action-keyboard-shortcuts"
import { EntityEditorTabsSupervisor } from "@/components/editor/entity-editor-tabs-supervisor"
import { CrateValidationSupervisor } from "@/components/crate-validation-supervisor"
import { DataSaveHint } from "@/components/data-save-hint"
import { UnsavedChangesProtector } from "@/components/UnsavedChangesProtector"
import { Nav } from "@/components/nav/nav"
import { usePathname } from "next/navigation"
import { useCrateName, useRecentCrates } from "@/lib/hooks/hooks"

export function InEditorProviders({ children, mode }: PropsWithChildren<{ mode: string }>) {
    const setPersistence = useSetPersistence()

    useEffect(() => {
        setPersistence(mode)
    }, [mode, setPersistence])

    return (
        <>
            {mode === "iframe" && <IFrameMessenger />}
            <CoreProvider>
                <SchemaWorkerProvider>
                    <GlobalModalProvider>
                        <ValidationContextProvider>
                            <ProviderBoundary>{children}</ProviderBoundary>
                        </ValidationContextProvider>
                    </GlobalModalProvider>
                </SchemaWorkerProvider>
            </CoreProvider>
        </>
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
            <DataSaveHint />
            <UnsavedChangesProtector />
            <Nav>{props.children}</Nav>
        </>
    )
})

function RecentlyUsed() {
    const pathname = usePathname()
    const { addRecentCrate } = useRecentCrates()
    const persistence = usePersistence()
    const crateId = persistence.getCrateId()
    const crateName = useCrateName()

    useEffect(() => {
        if (crateId) addRecentCrate(crateId, crateName)
    }, [addRecentCrate, crateId, crateName, pathname])

    return null
}
