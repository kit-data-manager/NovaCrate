"use client"

import { createContext, PropsWithChildren, useCallback, useEffect, useState } from "react"
import { useEditorState } from "@/lib/state/editor-state"
import { Diff } from "@/lib/utils"

export interface IEntityEditorTab {
    entityId: string
}

export function createEntityEditorTab(entity: IEntity): IEntityEditorTab {
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
    closeOtherTabs(id: string): void
    closeAllTabs(): void
    focusProperty(entityId: string, propertyName: string): void
    unFocusProperty(): void

    previewingFilePath: string
    setPreviewingFilePath(path: string): void
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
    closeOtherTabs() {
        console.warn("EntityEditorTabsContextProvider not mounted yet")
    },
    closeAllTabs() {
        console.warn("EntityEditorTabsContextProvider not mounted yet")
    },
    focusProperty() {
        console.warn("EntityEditorTabsContextProvider not mounted yet")
    },
    unFocusProperty() {
        console.warn("EntityEditorTabsContextProvider not mounted yet")
    },
    previewingFilePath: "",
    setPreviewingFilePath() {
        console.warn("EntityEditorTabsContextProvider not mounted yet")
    }
})

export function EntityEditorTabsProvider(props: PropsWithChildren) {
    const entitiesChangelist = useEditorState((store) => store.getEntitiesChangelist())
    const entities = useEditorState.useEntities()

    const [tabs, setTabs] = useState<IEntityEditorTab[]>([{ entityId: "./" }])
    const [focusedEntity, setFocusedEntity] = useState("./")
    const [focusedProperty, setFocusedProperty] = useState("")
    const [previewingFilePath, setPreviewingFilePath] = useState("")

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
        setFocusedProperty("")
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
                setFocusedEntity((currentFocus) => {
                    if (currentFocus !== id) {
                        return currentFocus
                    }
                    if (newTabs.length > 0) {
                        return newTabs[index > 0 ? index - 1 : index].entityId
                    } else {
                        return ""
                    }
                })

                return newTabs
            }

            return oldTabs
        })
    }, [])

    const closeOtherTabs = useCallback(
        (id: string) => {
            setTabs((oldTabs) => {
                return oldTabs.filter(
                    (tab) =>
                        tab.entityId === id || entitiesChangelist.get(tab.entityId) !== Diff.None
                )
            })
            focusTab(id)
        },
        [entitiesChangelist, focusTab]
    )

    const closeAllTabs = useCallback(() => {
        setTabs((oldTabs) => {
            const remainingTabs = oldTabs.filter(
                (tab) => entitiesChangelist.get(tab.entityId) !== Diff.None
            )
            if (remainingTabs.length > 0) {
                focusTab(remainingTabs[0].entityId)
            }
            return remainingTabs
        })
        setFocusedEntity("")
    }, [entitiesChangelist, focusTab])

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
                closeAllTabs,
                closeOtherTabs,
                focusProperty,
                unFocusProperty,
                previewingFilePath,
                setPreviewingFilePath
            }}
        >
            {props.children}
        </EntityEditorTabsContext.Provider>
    )
}
