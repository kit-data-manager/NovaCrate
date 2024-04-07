"use client"

import { createContext, PropsWithChildren, useCallback, useEffect, useState } from "react"

export interface IEntityEditorTab {
    entity: IFlatEntity
}

export function createEntityEditorTab(entity: IFlatEntity): IEntityEditorTab {
    return { entity }
}

export interface IEntityEditorTabsContext {
    tabs: IEntityEditorTab[]
    activeTabEntityID: string
    openTab(tab: IEntityEditorTab, focus?: boolean): void
    focusTab(id: string): void
    closeTab(id: string): void
}

export const EntityEditorTabsContext = createContext<IEntityEditorTabsContext>({
    tabs: [],
    activeTabEntityID: "",
    openTab() {
        console.log("EntityEditorTabsContextProvider not mounted yet")
    },
    focusTab() {
        console.log("EntityEditorTabsContextProvider not mounted yet")
    },
    closeTab() {
        console.log("EntityEditorTabsContextProvider not mounted yet")
    }
})

export function EntityEditorTabsProvider(props: PropsWithChildren) {
    const [tabs, setTabs] = useState<IEntityEditorTab[]>([])
    const [focused, setFocused] = useState("")

    const focusTab = useCallback((id: string) => {
        setFocused(id)
    }, [])

    const openTab = useCallback(
        (newTab: IEntityEditorTab, focus?: boolean) => {
            const existingTab = tabs.find((tab) => tab.entity["@id"] === newTab.entity["@id"])

            if (!existingTab) {
                const newTabs = tabs.slice()
                newTabs.push(structuredClone(newTab))
                setTabs(newTabs)
            }

            if (focus) {
                focusTab(newTab.entity["@id"])
            }
        },
        [focusTab, tabs]
    )

    const closeTab = useCallback(
        (id: string) => {
            const index = tabs.findIndex((tab) => tab.entity["@id"] === id)
            if (index >= 0) {
                const newTabs = tabs.slice()
                newTabs.splice(index, 1)
                if (newTabs.length > 0) {
                    setFocused(newTabs[index > 0 ? index - 1 : index].entity["@id"])
                } else {
                    setFocused("")
                }
                setTabs(newTabs)
            }
        },
        [tabs]
    )

    return (
        <EntityEditorTabsContext.Provider
            value={{
                tabs,
                activeTabEntityID: focused,
                openTab,
                focusTab,
                closeTab
            }}
        >
            {props.children}
        </EntityEditorTabsContext.Provider>
    )
}
