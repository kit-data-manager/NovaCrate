"use client"

import { createContext, PropsWithChildren, useCallback, useContext, useState } from "react"
import { CreateEntityModal } from "@/components/modals/create-entity/create-entity-modal"
import { SlimClass } from "@/lib/crate-verify/helpers"
import { SaveEntityChangesModal } from "@/components/modals/save-entity-changes-modal"
import { DeleteEntityModal } from "@/components/modals/delete-entity-modal"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { GlobalSearch } from "@/components/modals/global-search"

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
}

export const GlobalModalContext = createContext<IGlobalModalContext>({
    showCreateEntityModal() {},
    showSaveEntityChangesModal() {},
    showDeleteEntityModal() {},
    showGlobalSearchModal() {}
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

    const onEntityCreated = useCallback(
        (entity: IFlatEntity) => {
            setCreateEntityModalState({
                open: false
            })
            saveEntity(entity).catch(console.error)
        },
        [saveEntity]
    )

    return (
        <GlobalModalContext.Provider
            value={{
                showCreateEntityModal,
                showSaveEntityChangesModal,
                showDeleteEntityModal,
                showGlobalSearchModal
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

            {props.children}
        </GlobalModalContext.Provider>
    )
}
