"use client"

import { createContext, PropsWithChildren, useCallback, useState } from "react"

export interface IEntityEditorTab {
    entityId: string
    modifiedEntity: IFlatEntity
    dirty: boolean
}

export function createEntityEditorTab(entity: IFlatEntity): IEntityEditorTab {
    return { entityId: entity["@id"], modifiedEntity: structuredClone(entity), dirty: false }
}

export interface IEntityEditorTabsContext {
    tabs: IEntityEditorTab[]
    activeTabEntityID: string
    openTab(tab: IEntityEditorTab, focus?: boolean): void
    updateTab(tab: Partial<IEntityEditorTab> & { entityId: string }): void
    focusTab(id: string): void
    closeTab(id: string): void
}

export const EntityEditorTabsContext = createContext<IEntityEditorTabsContext>({
    tabs: [],
    activeTabEntityID: "",
    openTab() {
        console.log("EntityEditorTabsContextProvider not mounted yet")
    },
    updateTab() {
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
            const existingTab = tabs.find((tab) => tab.entityId === newTab.entityId)

            if (!existingTab) {
                const newTabs = tabs.slice()
                newTabs.push(structuredClone(newTab))
                setTabs(newTabs)
            }

            if (focus) {
                focusTab(newTab.entityId)
            }
        },
        [focusTab, tabs]
    )

    const updateTab = useCallback(
        (updatedTab: Partial<IEntityEditorTab> & { entityId: string }) => {
            const index = tabs.findIndex((tab) => tab.entityId === updatedTab.entityId)

            if (index >= 0) {
                const newTabs = tabs.slice()
                newTabs[index] = { ...newTabs[index], ...updatedTab }
                setTabs(newTabs)
            }
        },
        [tabs]
    )

    const closeTab = useCallback(
        (id: string) => {
            const index = tabs.findIndex((tab) => tab.entityId === id)
            if (index >= 0) {
                const newTabs = tabs.slice()
                newTabs.splice(index, 1)
                if (newTabs.length > 0) {
                    setFocused(newTabs[index > 0 ? index - 1 : index].entityId)
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
                updateTab,
                openTab,
                focusTab,
                closeTab
            }}
        >
            {props.children}
        </EntityEditorTabsContext.Provider>
    )
}
