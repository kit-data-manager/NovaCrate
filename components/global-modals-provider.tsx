"use client"

import { createContext, PropsWithChildren, useCallback, useState } from "react"
import { CreateEntityModal } from "@/components/create-entity/create-entity-modal"
import { SlimClass } from "@/lib/crate-verify/helpers"
import { SaveEntityChangesModal } from "@/components/save-entity-changes-modal"
import { DeleteEntityModal } from "@/components/delete-entity-modal"

export interface AutoReference {
    entityId: string
    propertyName: string
    valueIdx: number
}

export interface IGlobalModalContext {
    showCreateEntityModal(restrictToClasses?: SlimClass[], autoReference?: AutoReference): void
    showSaveEntityChangesModal(entityId: string): void
    showDeleteEntityModal(entityId: string): void
}

export const GlobalModalContext = createContext<IGlobalModalContext>({
    showCreateEntityModal() {},
    showSaveEntityChangesModal() {},
    showDeleteEntityModal() {}
})

export function GlobalModalProvider(props: PropsWithChildren) {
    const [createEntityModalState, setCreateEntityModalState] = useState<{
        open: boolean
        autoReference?: AutoReference
        restrictToClasses?: SlimClass[]
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

    const showCreateEntityModal = useCallback(
        (restrictToClasses?: SlimClass[], autoReference?: AutoReference) => {
            setCreateEntityModalState({
                open: true,
                restrictToClasses,
                autoReference
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

    const onCreateEntityModalOpenChange = useCallback((isOpen: boolean) => {
        setCreateEntityModalState((oldValue) => {
            return {
                ...oldValue,
                open: isOpen
            }
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

    const onEntityCreated = useCallback(() => {
        setCreateEntityModalState({
            open: false
        })
    }, [])

    return (
        <GlobalModalContext.Provider
            value={{
                showCreateEntityModal,
                showSaveEntityChangesModal,
                showDeleteEntityModal
            }}
        >
            <CreateEntityModal
                open={createEntityModalState.open}
                onEntityCreated={onEntityCreated}
                onOpenChange={onCreateEntityModalOpenChange}
                restrictToClasses={createEntityModalState.restrictToClasses}
                autoReference={createEntityModalState.autoReference}
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

            {props.children}
        </GlobalModalContext.Provider>
    )
}
