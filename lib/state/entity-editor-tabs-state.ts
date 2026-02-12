"use client"

import { editorState } from "@/lib/state/editor-state"
import { Diff } from "@/lib/utils"
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { unstable_ssrSafe as ssrSafe } from "zustand/middleware"

export interface IEntityEditorTab {
    entityId: string
}

export function createEntityEditorTab(entity: IEntity): IEntityEditorTab {
    return {
        entityId: entity["@id"]
    }
}

export interface IEntityEditorTabsState {
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

export const useEntityEditorTabs = create<IEntityEditorTabsState>()(
    ssrSafe(
        immer((set, get) => ({
            tabs: [],
            activeTabEntityID: "",
            focusedProperty: "",
            openTab(tab: IEntityEditorTab, focus?: boolean) {
                const existing = get().tabs.find((t) => t.entityId === tab.entityId)
                if (!existing) {
                    set((store) => {
                        store.tabs.push(tab)
                    })
                }

                if (focus) {
                    get().focusTab(tab.entityId)
                }
            },
            focusTab(id: string) {
                set((store) => {
                    store.activeTabEntityID = id
                    store.focusedProperty = ""
                })
            },
            closeTab(id: string) {
                const index = get().tabs.findIndex((tab) => tab.entityId === id)
                if (index >= 0) {
                    set((store) => {
                        store.tabs.splice(index, 1)
                        if (store.activeTabEntityID === id) {
                            if (store.tabs.length > 0) {
                                store.activeTabEntityID =
                                    store.tabs[index > 0 ? index - 1 : index].entityId
                            } else {
                                store.activeTabEntityID = ""
                            }
                        }
                    })
                }
            },
            closeOtherTabs(id: string) {
                const changelist = editorState.getState().getEntitiesChangelist()
                set((store) => {
                    store.tabs = store.tabs.filter(
                        (tab) => tab.entityId === id || changelist.get(tab.entityId) !== Diff.None
                    )
                })
                get().focusTab(id)
            },
            closeAllTabs() {
                set((store) => {
                    const changelist = editorState.getState().getEntitiesChangelist()
                    store.tabs = store.tabs.filter(
                        (tab) => changelist.get(tab.entityId) !== Diff.None
                    )
                    if (store.tabs.length > 0) {
                        get().focusTab(store.tabs[0].entityId)
                    }
                    store.activeTabEntityID = ""
                })
            },
            focusProperty(entityId: string, propertyName: string) {
                get().focusTab(entityId)
                set((store) => {
                    store.focusedProperty = propertyName
                })
            },
            unFocusProperty() {
                set((store) => {
                    store.focusedProperty = ""
                })
            },

            previewingFilePath: "",
            setPreviewingFilePath(path: string) {
                set((store) => {
                    store.previewingFilePath = path
                })
            }
        }))
    )
)
