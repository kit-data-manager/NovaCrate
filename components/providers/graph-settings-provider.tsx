"use client"

import { createContext, PropsWithChildren, useContext, useRef } from "react"
import { StoreApi, useStore } from "zustand"
import { createGraphSettings, GraphSettings } from "@/lib/state/graph-settings"

const GraphSettingsContext = createContext<StoreApi<GraphSettings> | null>(null)

export function GraphSettingsProvider(props: PropsWithChildren) {
    const storeRef = useRef<StoreApi<GraphSettings>>(undefined)

    if (!storeRef.current) {
        storeRef.current = createGraphSettings()
    }

    return (
        <GraphSettingsContext.Provider value={storeRef.current}>
            {props.children}
        </GraphSettingsContext.Provider>
    )
}

export function useGraphSettings<T>(selector: (store: GraphSettings) => T): T {
    const store = useContext(GraphSettingsContext)

    if (!store) throw "useGraphSettings used outside of GraphSettingsContext"

    return useStore(store, selector)
}

export function useGraphSettingsNoSelector(): GraphSettings {
    const store = useContext(GraphSettingsContext)

    if (!store) throw "useGraphSettingsNoSelector used outside of GraphSettingsContext"

    return useStore(store)
}
