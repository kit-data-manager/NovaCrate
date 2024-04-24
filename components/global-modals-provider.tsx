"use client"

import { createContext, PropsWithChildren, useCallback, useState } from "react"
import { CreateEntityModal } from "@/components/create-entity-modal"
import { SlimClass } from "@/lib/crate-verify/helpers"

export interface IGlobalModalContext {
    showCreateEntityModal(
        restrictToClasses?: SlimClass[],
        callback?: (ref: IReference) => void
    ): void
}

export const GlobalModalContext = createContext<IGlobalModalContext>({
    showCreateEntityModal() {}
})

export function GlobalModalProvider(props: PropsWithChildren) {
    const [createEntityModalState, setCreateEntityModalState] = useState<{
        open: boolean
        callback?: (ref: IReference) => void
        restrictToClasses?: SlimClass[]
    }>({
        open: false
    })

    const showCreateEntityModal = useCallback(
        (restrictToClasses?: SlimClass[], callback?: (ref: IReference) => void) => {
            setCreateEntityModalState({
                open: true,
                restrictToClasses,
                callback
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

    const onEntityCreated = useCallback((ref: IReference) => {
        setCreateEntityModalState((oldState) => {
            if (oldState.callback) {
                oldState.callback(ref)
            }

            return {
                open: false
            }
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
            />

            {props.children}
        </GlobalModalContext.Provider>
    )
}
