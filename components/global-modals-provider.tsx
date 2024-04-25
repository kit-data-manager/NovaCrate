"use client"

import { createContext, PropsWithChildren, useCallback, useState } from "react"
import { CreateEntityModal } from "@/components/create-entity-modal"
import { SlimClass } from "@/lib/crate-verify/helpers"

export interface AutoReference {
    entityId: string
    propertyName: string
    valueIdx: number
}

export interface IGlobalModalContext {
    showCreateEntityModal(restrictToClasses?: SlimClass[], autoReference?: AutoReference): void
}

export const GlobalModalContext = createContext<IGlobalModalContext>({
    showCreateEntityModal() {}
})

export function GlobalModalProvider(props: PropsWithChildren) {
    const [createEntityModalState, setCreateEntityModalState] = useState<{
        open: boolean
        autoReference?: AutoReference
        restrictToClasses?: SlimClass[]
    }>({
        open: false
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

    const onCreateEntityModalOpenChange = useCallback((isOpen: boolean) => {
        setCreateEntityModalState((oldValue) => {
            return {
                ...oldValue,
                open: isOpen
            }
        })
    }, [])

    const onEntityCreated = useCallback(() => {
        setCreateEntityModalState({
            open: false
        })
    }, [])

    return (
        <GlobalModalContext.Provider
            value={{
                showCreateEntityModal
            }}
        >
            <CreateEntityModal
                open={createEntityModalState.open}
                onEntityCreated={onEntityCreated}
                onOpenChange={onCreateEntityModalOpenChange}
                restrictToClasses={createEntityModalState.restrictToClasses}
                autoReference={createEntityModalState.autoReference}
            />

            {props.children}
        </GlobalModalContext.Provider>
    )
}
