"use client"

import { createContext, PropsWithChildren, useContext, useRef } from "react"
import { StoreApi, useStore } from "zustand"
import { createGlobalSettings, GlobalSettings } from "@/lib/state/global-settings"

const GlobalSettingsContext = createContext<StoreApi<GlobalSettings> | null>(null)

export function GlobalSettingsProvider(props: PropsWithChildren) {
    const storeRef = useRef<StoreApi<GlobalSettings>>(undefined)

    if (!storeRef.current) {
        storeRef.current = createGlobalSettings()
    }

    return (
        <GlobalSettingsContext.Provider value={storeRef.current}>
            {props.children}
        </GlobalSettingsContext.Provider>
    )
}

export function useGlobalSettings<T>(selector: (store: GlobalSettings) => T): T {
    const store = useContext(GlobalSettingsContext)

    if (!store) throw "useGlobalSettings used outside of GlobalSettingsContext"

    return useStore(store, selector)
}

export function useGlobalSettingsNoSelector(): GlobalSettings {
    const store = useContext(GlobalSettingsContext)

    if (!store) throw "useGlobalSettingsNoSelector used outside of GlobalSettingsContext"

    return useStore(store)
}
