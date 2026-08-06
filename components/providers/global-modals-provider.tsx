"use client"

import { createContext, PropsWithChildren, useCallback, useState } from "react"
import { CreateEntityModal } from "@/components/modals/create-entity/create-entity-modal"
import { SlimClass } from "@/lib/schema-worker/helpers"
import { SaveEntityChangesModal } from "@/components/modals/save-entity-changes-modal"
import { DeleteEntityModal } from "@/components/modals/delete-entity-modal"
import { GlobalSearch } from "@/components/modals/global-search"
import { AddPropertyModal } from "@/components/modals/add-property/add-property-modal"
import { FindReferencesModal } from "@/components/modals/find-references-modal"
import { SaveAsModal } from "@/components/modals/save-as-modal"
import { SettingsModal, SettingsPages } from "@/components/modals/settings/settings-modal"
import { DocumentationModal } from "@/components/modals/documentation-modal"
import { AutoReference } from "@/lib/utils"
import { AboutModal } from "@/components/modals/about-modal"
import { CrateExportedModal } from "@/components/modals/crate-exported-modal"
import { MultiRenameModal } from "@/components/modals/multi-rename-modal"
import { CoreGuard } from "@/components/providers/core-provider"
import { ManageProfilesModal } from "@/components/modals/manage-profiles-modal"

export interface IGlobalModalContext {
    showCreateEntityModal(options?: {
        restrictToClasses?: SlimClass[]
        restrictToEntityRules?: string[]
        autoReference?: AutoReference
        id?: string
        basePath?: string
    }): void
    showSaveEntityChangesModal(entityId: string): void
    showDeleteEntityModal(entityId: string): void
    showGlobalSearchModal(): void
    showAddPropertyModal(
        entity: IEntity,
        callback: AddPropertyModalCallback,
        onlyReferences?: boolean
    ): void
    showFindReferencesModal(entityId: string): void
    showSaveAsModal(entityId: string): void
    showSettingsModal(page?: SettingsPages): void
    showDocumentationModal(): void
    showAboutModal(): void
    showCrateExportedModal(): void
    showMultiRenameModal(
        changes: { from: string; to: string }[],
        onCloseCallback?: () => void
    ): void
    showManageProfilesModal(): void
}

export type AddPropertyModalCallback = (
    propertyName: string,
    values: EntitySinglePropertyTypes
) => void

export const GlobalModalContext = createContext<IGlobalModalContext>({
    showCreateEntityModal() {},
    showSaveEntityChangesModal() {},
    showDeleteEntityModal() {},
    showGlobalSearchModal() {},
    showAddPropertyModal() {},
    showFindReferencesModal() {},
    showSaveAsModal() {},
    showSettingsModal() {},
    showDocumentationModal() {},
    showAboutModal() {},
    showCrateExportedModal() {},
    showMultiRenameModal() {},
    showManageProfilesModal() {}
})

export function GlobalModalProvider(props: PropsWithChildren) {
    const [createEntityModalState, setCreateEntityModalState] = useState<{
        open: boolean
        autoReference?: AutoReference
        restrictToClasses?: SlimClass[]
        restrictToEntityRules?: string[]
        id?: string
        basePath?: string
    }>({
        open: false
    })
    const [saveEntityChangesModalState, setSaveEntityChangesModalState] = useState({
        open: false,
        entityId: ""
    })
    const [deleteEntityModalState, setDeleteEntityModalState] = useState({
        open: false,
        entityId: ""
    })
    const [globalSearchState, setGlobalSearchState] = useState({
        open: false
    })
    const [addPropertyModalState, setAddPropertyModalState] = useState<
        | {
              open: boolean
              onPropertyAdd: AddPropertyModalCallback
              entity: IEntity
              onlyReferences: boolean
          }
        | undefined
    >()
    const [findReferencesModalState, setFindReferencesModalState] = useState({
        open: false,
        entityId: ""
    })
    const [saveAsModalState, setSaveAsModalState] = useState({
        open: false,
        entityId: ""
    })
    const [settingsModalState, setSettingsModalState] = useState<{
        open: boolean
        page?: SettingsPages
    }>({ open: false })
    const [documentationModalState, setDocumentationModalState] = useState({ open: false })
    const [aboutModalState, setAboutModalState] = useState({ open: false })
    const [crateExportedModalState, setCrateExportedModalState] = useState({ open: false })
    const [multiRenameModal, setMultiRenameModal] = useState<{
        open: boolean
        changes: { from: string; to: string }[]
        onCloseCallback?: () => void
    }>({ open: false, changes: [] })
    const [manageProfilesModalState, setManageProfilesModalState] = useState<{
        open: boolean
    }>({ open: false })

    const showCreateEntityModal: IGlobalModalContext["showCreateEntityModal"] = useCallback(
        ({ restrictToClasses, restrictToEntityRules, autoReference, id, basePath } = {}) => {
            console.log(restrictToEntityRules)
            setCreateEntityModalState({
                open: true,
                restrictToClasses,
                restrictToEntityRules,
                autoReference,
                id,
                basePath
            })
        },
        []
    )

    const showSaveEntityChangesModal = useCallback((entityId: string) => {
        setSaveEntityChangesModalState({
            open: true,
            entityId
        })
    }, [])

    const showDeleteEntityModal = useCallback((entityId: string) => {
        setDeleteEntityModalState({
            open: true,
            entityId
        })
    }, [])

    const showGlobalSearchModal = useCallback(() => {
        setGlobalSearchState({ open: true })
    }, [])

    const showAddPropertyModal = useCallback(
        (entity: IEntity, callback: AddPropertyModalCallback, onlyReferences: boolean = false) => {
            setAddPropertyModalState({
                open: true,
                entity,
                onPropertyAdd: callback,
                onlyReferences
            })
        },
        []
    )

    const showFindReferencesModal = useCallback((entityId: string) => {
        setFindReferencesModalState({
            open: true,
            entityId
        })
    }, [])

    const showSaveAsModal = useCallback((entityId: string) => {
        setSaveAsModalState({
            open: true,
            entityId
        })
    }, [])

    const showSettingsModal = useCallback((page?: SettingsPages) => {
        setSettingsModalState({ open: true, page })
    }, [])

    const showDocumentationModal = useCallback(() => {
        setDocumentationModalState({ open: true })
    }, [])

    const showCrateExportedModal = useCallback(() => {
        setCrateExportedModalState({ open: true })
    }, [])

    const showAboutModal = useCallback(() => {
        setAboutModalState({ open: true })
    }, [])

    const showMultiRenameModal = useCallback(
        (changes: { from: string; to: string }[], onCloseCallback?: () => void) => {
            setMultiRenameModal({ open: true, changes, onCloseCallback })
        },
        []
    )

    const showManageProfilesModal = useCallback(() => {
        setManageProfilesModalState({ open: true })
    }, [])

    const onCreateEntityModalOpenChange = useCallback((isOpen: boolean) => {
        setCreateEntityModalState({
            autoReference: undefined,
            id: undefined,
            restrictToClasses: undefined,
            restrictToEntityRules: undefined,
            open: isOpen
        })
    }, [])

    const onSaveEntityChangesModalOpenChange = useCallback((isOpen: boolean) => {
        setSaveEntityChangesModalState({
            entityId: "",
            open: isOpen
        })
    }, [])

    const onDeleteEntityModalOpenChange = useCallback((isOpen: boolean) => {
        setDeleteEntityModalState((old) => ({
            entityId: old.entityId,
            open: isOpen
        }))
    }, [])

    const onGlobalSearchModalOpenChange = useCallback((isOpen: boolean) => {
        setGlobalSearchState({ open: isOpen })
    }, [])

    const onAddPropertyModalOpenChange = useCallback(() => {
        setAddPropertyModalState((old) =>
            old === undefined ? old : { ...old, open: false, onlyReferences: false }
        )
    }, [])

    const onFindReferencesModalOpenChange = useCallback(() => {
        setFindReferencesModalState({ open: false, entityId: "" })
    }, [])

    const onSaveAsModalOpenChange = useCallback(() => {
        setSaveAsModalState({ open: false, entityId: "" })
    }, [])

    const onSettingsModalOpenChange = useCallback((open: boolean) => {
        setSettingsModalState((prev) => ({ ...prev, open }))
    }, [])

    const onDocumentationModalOpenChange = useCallback((open: boolean) => {
        setDocumentationModalState({ open })
    }, [])

    const onAboutModalOpenChange = useCallback((open: boolean) => {
        setAboutModalState({ open })
    }, [])

    const onCrateExportedModalOpenChange = useCallback((open: boolean) => {
        setCrateExportedModalState({ open })
    }, [])

    const onRenameEntityOpenChange = useCallback(
        (open: boolean) => {
            if (!open) multiRenameModal.onCloseCallback?.()
            setMultiRenameModal((prev) => ({
                open,
                changes: open ? prev.changes : [],
                onCloseCallback: open ? prev.onCloseCallback : undefined
            }))
        },
        [multiRenameModal]
    )

    const onManageProfileOpenChange = useCallback((open: boolean) => {
        setManageProfilesModalState({
            open
        })
    }, [])

    return (
        <GlobalModalContext.Provider
            value={{
                showCreateEntityModal,
                showSaveEntityChangesModal,
                showDeleteEntityModal,
                showGlobalSearchModal,
                showFindReferencesModal,
                showAddPropertyModal,
                showSaveAsModal,
                showSettingsModal,
                showDocumentationModal,
                showAboutModal,
                showCrateExportedModal,
                showMultiRenameModal,
                showManageProfilesModal
            }}
        >
            <CoreGuard>
                <CreateEntityModal
                    open={createEntityModalState.open}
                    onOpenChange={onCreateEntityModalOpenChange}
                    restrictToClasses={createEntityModalState.restrictToClasses}
                    restrictToEntityRules={createEntityModalState.restrictToEntityRules}
                    autoReference={createEntityModalState.autoReference}
                    forceId={createEntityModalState.id}
                    basePath={createEntityModalState.basePath}
                />
                <SaveEntityChangesModal
                    open={saveEntityChangesModalState.open}
                    onOpenChange={onSaveEntityChangesModalOpenChange}
                    entityId={saveEntityChangesModalState.entityId}
                />
                <DeleteEntityModal
                    open={deleteEntityModalState.open}
                    onOpenChange={onDeleteEntityModalOpenChange}
                    entityId={deleteEntityModalState.entityId}
                />
                <SaveAsModal
                    open={saveAsModalState.open}
                    onOpenChange={onSaveAsModalOpenChange}
                    entityId={saveAsModalState.entityId}
                />
                <MultiRenameModal
                    open={multiRenameModal.open}
                    onOpenChange={onRenameEntityOpenChange}
                    changes={multiRenameModal.changes}
                />
                <GlobalSearch
                    open={globalSearchState.open}
                    onOpenChange={onGlobalSearchModalOpenChange}
                />
                {addPropertyModalState !== undefined && (
                    <AddPropertyModal
                        open={addPropertyModalState.open}
                        onPropertyAdd={addPropertyModalState.onPropertyAdd}
                        onOpenChange={onAddPropertyModalOpenChange}
                        entity={addPropertyModalState.entity}
                        onlyReferences={addPropertyModalState.onlyReferences}
                    />
                )}
                <FindReferencesModal
                    open={findReferencesModalState.open}
                    onOpenChange={onFindReferencesModalOpenChange}
                    entityId={findReferencesModalState.entityId}
                />

                <ManageProfilesModal
                    open={manageProfilesModalState.open}
                    onOpenChange={onManageProfileOpenChange}
                />
            </CoreGuard>

            <SettingsModal
                open={settingsModalState.open}
                onOpenChange={onSettingsModalOpenChange}
                defaultPage={settingsModalState.page}
            />
            <DocumentationModal
                open={documentationModalState.open}
                onOpenChange={onDocumentationModalOpenChange}
            />
            <AboutModal open={aboutModalState.open} onOpenChange={onAboutModalOpenChange} />
            <CrateExportedModal
                open={crateExportedModalState.open}
                onOpenChange={onCrateExportedModalOpenChange}
            />

            {props.children}
        </GlobalModalContext.Provider>
    )
}
