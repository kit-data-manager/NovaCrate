"use client"

import { createContext, PropsWithChildren, useContext, useRef } from "react"
import { ActionStore, createActionStore } from "@/lib/state/actions"
import { StoreApi, useStore } from "zustand"
import { useStoreWithEqualityFn } from "zustand/traditional"
import { shallow } from "zustand/vanilla/shallow"

const ActionsContext = createContext<StoreApi<ActionStore> | null>(null)

export function ActionsProvider(props: PropsWithChildren) {
    const actions = useRef<StoreApi<ActionStore>>(undefined)

    if (!actions.current) {
        actions.current = createActionStore()
    }

    return (
        <ActionsContext.Provider value={actions.current}>{props.children}</ActionsContext.Provider>
    )
}

export function useActionsStore<T>(selector: (store: ActionStore) => T): T {
    const actions = useContext(ActionsContext)

    if (!actions) throw "useActionsStore used outside of ActionsContext"
    return useStoreWithEqualityFn(actions, selector, shallow)
}

export function useActionsNoSelector(): ActionStore {
    const actions = useContext(ActionsContext)

    if (!actions) throw "useActionsNoSelector used outside of ActionsContext"
    return useStore(actions)
}
