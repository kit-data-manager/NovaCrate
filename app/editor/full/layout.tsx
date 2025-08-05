"use client"

import { PropsWithChildren, useContext, useEffect, useRef } from "react"
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
import { ValidationProvider } from "@/lib/validation/validation-provider"
import { editorState } from "@/lib/state/editor-state"
import { SpecificationValidator } from "@/lib/validation/validators/specification-validator"
import { ValidationContext } from "@/components/providers/validation-context"

export default function EditorLayout(props: PropsWithChildren) {
    const validation = useRef<ValidationProvider>(null!)
    if (!validation.current) {
        validation.current = new ValidationProvider(editorState)
        validation.current.addValidator(new SpecificationValidator())
    }

    return (
        <ActionsProvider>
            <SchemaWorkerProvider>
                <GlobalModalProvider>
                    <GraphStateProvider>
                        <GraphSettingsProvider>
                            <ValidationContext.Provider value={{ validation: validation.current }}>
                                <DefaultActions />
                                <EntityActions />
                                <ActionKeyboardShortcuts />
                                <RecentlyUsed />
                                <EntityEditorTabsSupervisor />
                                <Nav>{props.children}</Nav>
                            </ValidationContext.Provider>
                        </GraphSettingsProvider>
                    </GraphStateProvider>
                </GlobalModalProvider>
            </SchemaWorkerProvider>
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
