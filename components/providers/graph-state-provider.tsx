"use client"

import { createContext, PropsWithChildren, useContext, useRef } from "react"
import { StoreApi, useStore } from "zustand"
import { createGraphState, GraphState } from "@/lib/state/graph-state"

const GraphStateContext = createContext<StoreApi<GraphState> | null>(null)

export function GraphStateProvider(props: PropsWithChildren) {
    const storeRef = useRef<StoreApi<GraphState>>(undefined)

    if (!storeRef.current) {
        storeRef.current = createGraphState()
    }

    return (
        <GraphStateContext.Provider value={storeRef.current}>
            {props.children}
        </GraphStateContext.Provider>
    )
}

export function useGraphState<T>(selector: (store: GraphState) => T): T {
    const store = useContext(GraphStateContext)

    if (!store) throw "useGraphState used outside of GraphStateContext"

    return useStore(store, selector)
}

export function useGraphStateNoSelector(): GraphState {
    const store = useContext(GraphStateContext)

    if (!store) throw "useGraphStateNoSelector used outside of GraphStateContext"

    return useStore(store)
}
