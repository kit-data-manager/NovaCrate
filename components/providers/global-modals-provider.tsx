"use client"

import { createContext, PropsWithChildren, useCallback, useContext, useState } from "react"
import { CreateEntityModal } from "@/components/modals/create-entity/create-entity-modal"
import { SlimClass } from "@/lib/crate-verify/helpers"
import { SaveEntityChangesModal } from "@/components/modals/save-entity-changes-modal"
import { DeleteEntityModal } from "@/components/modals/delete-entity-modal"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { GlobalSearch } from "@/components/modals/global-search"
import { AddPropertyModal } from "@/components/modals/add-property-modal"
import { FindReferencesModal } from "@/components/modals/find-references-modal"
import { SaveAsModal } from "@/components/modals/save-as-modal"

export interface AutoReference {
    entityId: string
    propertyName: string
    valueIdx: number
}

export interface IGlobalModalContext {
    showCreateEntityModal(
        restrictToClasses?: SlimClass[],
        autoReference?: AutoReference,
        id?: string,
        basePath?: string
    ): void
    showSaveEntityChangesModal(entityId: string): void
    showDeleteEntityModal(entityId: string): void
    showGlobalSearchModal(): void
    showAddPropertyModal(typeArray: string[], callback: AddPropertyModalCallback): void
    showFindReferencesModal(entityId: string): void
    showSaveAsModal(entityId: string): void
}

export type AddPropertyModalCallback = (
    propertyName: string,
    values: FlatEntitySinglePropertyTypes[]
) => void

export const GlobalModalContext = createContext<IGlobalModalContext>({
    showCreateEntityModal() {},
    showSaveEntityChangesModal() {},
    showDeleteEntityModal() {},
    showGlobalSearchModal() {},
    showAddPropertyModal() {},
    showFindReferencesModal() {},
    showSaveAsModal() {}
})

export function GlobalModalProvider(props: PropsWithChildren) {
    const { saveEntity } = useContext(CrateDataContext)

    const [createEntityModalState, setCreateEntityModalState] = useState<{
        open: boolean
        autoReference?: AutoReference
        restrictToClasses?: SlimClass[]
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
    const [addPropertyModalState, setAddPropertyModalState] = useState<{
        open: boolean
        onPropertyAdd: AddPropertyModalCallback
        typeArray: string[]
    }>({
        open: false,
        onPropertyAdd: () => {},
        typeArray: []
    })
    const [findReferencesModalState, setFindReferencesModalState] = useState({
        open: false,
        entityId: ""
    })
    const [saveAsModalState, setSaveAsModalState] = useState({
        open: false,
        entityId: ""
    })

    const showCreateEntityModal = useCallback(
        (
            restrictToClasses?: SlimClass[],
            autoReference?: AutoReference,
            id?: string,
            basePath?: string
        ) => {
            setCreateEntityModalState({
                open: true,
                restrictToClasses,
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
        (typeArray: string[], callback: AddPropertyModalCallback) => {
            setAddPropertyModalState({
                open: true,
                typeArray,
                onPropertyAdd: callback
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

    const onCreateEntityModalOpenChange = useCallback((isOpen: boolean) => {
        setCreateEntityModalState({
            autoReference: undefined,
            id: undefined,
            restrictToClasses: undefined,
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
        setAddPropertyModalState((old) => ({ ...old, open: false }))
    }, [])

    const onFindReferencesModalOpenChange = useCallback(() => {
        setFindReferencesModalState({ open: false, entityId: "" })
    }, [])

    const onSaveAsModalOpenChange = useCallback(() => {
        setSaveAsModalState({ open: false, entityId: "" })
    }, [])

    const onEntityCreated = useCallback(
        (entity?: IFlatEntity) => {
            setCreateEntityModalState({
                open: false
            })
            if (entity) saveEntity(entity).catch(console.error)
        },
        [saveEntity]
    )

    return (
        <GlobalModalContext.Provider
            value={{
                showCreateEntityModal,
                showSaveEntityChangesModal,
                showDeleteEntityModal,
                showGlobalSearchModal,
                showFindReferencesModal,
                showAddPropertyModal,
                showSaveAsModal
            }}
        >
            <CreateEntityModal
                open={createEntityModalState.open}
                onEntityCreated={onEntityCreated}
                onOpenChange={onCreateEntityModalOpenChange}
                restrictToClasses={createEntityModalState.restrictToClasses}
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
            <GlobalSearch
                open={globalSearchState.open}
                onOpenChange={onGlobalSearchModalOpenChange}
            />
            <AddPropertyModal
                open={addPropertyModalState.open}
                onPropertyAdd={addPropertyModalState.onPropertyAdd}
                onOpenChange={onAddPropertyModalOpenChange}
                typeArray={addPropertyModalState.typeArray}
            />
            <FindReferencesModal
                open={findReferencesModalState.open}
                onOpenChange={onFindReferencesModalOpenChange}
                entityId={findReferencesModalState.entityId}
            />
            <SaveAsModal
                open={saveAsModalState.open}
                onOpenChange={onSaveAsModalOpenChange}
                entityId={saveAsModalState.entityId}
            />

            {props.children}
        </GlobalModalContext.Provider>
    )
}
