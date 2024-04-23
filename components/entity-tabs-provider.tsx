"use client"

import { createContext, PropsWithChildren, useCallback, useState } from "react"

export interface IEntityEditorTab {
    entityId: string
}

export function createEntityEditorTab(entity: IFlatEntity): IEntityEditorTab {
    return {
        entityId: entity["@id"]
    }
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
            setTabs((oldTabs) => {
                const existingTab = oldTabs.find((tab) => tab.entityId === newTab.entityId)

                if (!existingTab) {
                    const newTabs = oldTabs.slice()
                    newTabs.push(structuredClone(newTab))
                    setTabs(newTabs)
                    return newTabs
                }

                return oldTabs
            })

            if (focus) {
                focusTab(newTab.entityId)
            }
        },
        [focusTab]
    )

    const closeTab = useCallback((id: string) => {
        setTabs((oldTabs) => {
            const index = oldTabs.findIndex((tab) => tab.entityId === id)
            if (index >= 0) {
                const newTabs = oldTabs.slice()
                newTabs.splice(index, 1)
                if (newTabs.length > 0) {
                    setFocused(newTabs[index > 0 ? index - 1 : index].entityId)
                } else {
                    setFocused("")
                }

                return newTabs
            }

            return oldTabs
        })
    }, [])

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
