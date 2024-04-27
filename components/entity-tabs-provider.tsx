"use client"

import { createContext, PropsWithChildren, useCallback, useEffect, useState } from "react"
import { useEditorState } from "@/components/editor-state"
import { Diff } from "@/lib/utils"

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
    focusedProperty: string
    openTab(tab: IEntityEditorTab, focus?: boolean): void
    focusTab(id: string): void
    closeTab(id: string): void
    focusProperty(entityId: string, propertyName: string): void
    unFocusProperty(): void
}

export const EntityEditorTabsContext = createContext<IEntityEditorTabsContext>({
    tabs: [],
    activeTabEntityID: "",
    focusedProperty: "",
    openTab() {
        console.warn("EntityEditorTabsContextProvider not mounted yet")
    },
    focusTab() {
        console.warn("EntityEditorTabsContextProvider not mounted yet")
    },
    closeTab() {
        console.warn("EntityEditorTabsContextProvider not mounted yet")
    },
    focusProperty() {
        console.warn("EntityEditorTabsContextProvider not mounted yet")
    },
    unFocusProperty() {
        console.warn("EntityEditorTabsContextProvider not mounted yet")
    }
})

export function EntityEditorTabsProvider(props: PropsWithChildren) {
    const entitiesChangelist = useEditorState((store) => store.getEntitiesChangelist())
    const entities = useEditorState.useEntities()

    const [tabs, setTabs] = useState<IEntityEditorTab[]>([])
    const [focusedEntity, setFocusedEntity] = useState("")
    const [focusedProperty, setFocusedProperty] = useState("")

    useEffect(() => {
        for (const [entityId, diff] of entitiesChangelist) {
            if (diff !== Diff.None) {
                if (!tabs.find((tab) => tab.entityId === entityId)) {
                    const entity = entities.get(entityId)
                    if (entity) openTab(createEntityEditorTab(entity))
                }
            }
        }
    })

    const focusTab = useCallback((id: string) => {
        setFocusedEntity(id)
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
                    setFocusedEntity(newTabs[index > 0 ? index - 1 : index].entityId)
                } else {
                    setFocusedEntity("")
                }

                return newTabs
            }

            return oldTabs
        })
    }, [])

    const focusProperty = useCallback(
        (entityId: string, propertyName: string) => {
            focusTab(entityId)
            setFocusedProperty(propertyName)
        },
        [focusTab]
    )

    const unFocusProperty = useCallback(() => {
        setFocusedProperty("")
    }, [])

    return (
        <EntityEditorTabsContext.Provider
            value={{
                tabs,
                activeTabEntityID: focusedEntity,
                focusedProperty,
                openTab,
                focusTab,
                closeTab,
                focusProperty,
                unFocusProperty
            }}
        >
            {props.children}
        </EntityEditorTabsContext.Provider>
    )
}
