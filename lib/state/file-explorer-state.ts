import { create } from "zustand"
import { unstable_ssrSafe as ssrSafe } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { ViewerType } from "@/lib/file-preview"
import { normalizeIdentifier } from "@/lib/utils"

export interface IFilePreviewTab {
    filePath: string
    fileName: string
    viewerType: ViewerType
}

interface FileExplorerState {
    filePreviewTabs: IFilePreviewTab[]
    activeFilePreviewTabPath?: string
    openTab(tab: IFilePreviewTab, focus?: boolean): void
    focusTab(path: string): void
    closeTab(path: string): void
    closeOtherTabs(path: string): void
    closeAllTabs(): void
}

export const useFileExplorerState = create<FileExplorerState>()(
    ssrSafe(
        immer((set, get) => ({
            filePreviewTabs: [],
            activeFilePreviewTabPath: undefined,

            openTab(tab: IFilePreviewTab, focus?: boolean) {
                set((store) => {
                    if (focus) store.activeFilePreviewTabPath = tab.filePath

                    const existing = store.filePreviewTabs.findIndex(
                        (t) => normalizeIdentifier(t.filePath) === normalizeIdentifier(tab.filePath)
                    )
                    if (existing >= 0) {
                        store.filePreviewTabs[existing] = tab
                    } else {
                        store.filePreviewTabs.push(tab)
                    }

                    return store
                })
            },

            focusTab(path: string) {
                if (
                    !get().filePreviewTabs.find(
                        (tab) => normalizeIdentifier(tab.filePath) === normalizeIdentifier(path)
                    )
                ) {
                    console.warn(
                        `Tried to focus file preview tab for ${path}, but the tab does not exist`
                    )
                    return
                }
                set({
                    activeFilePreviewTabPath: path
                })
            },

            closeTab(path: string) {
                set((store) => {
                    if (store.activeFilePreviewTabPath === path) {
                        const indexBefore = store.filePreviewTabs.findIndex(
                            (tab) => normalizeIdentifier(tab.filePath) === normalizeIdentifier(path)
                        )
                        if (indexBefore >= 0) {
                            if (indexBefore > 0) {
                                // Switch to tab left of the one being closed
                                store.activeFilePreviewTabPath =
                                    store.filePreviewTabs[indexBefore - 1].filePath
                            } else if (store.filePreviewTabs.length > 1) {
                                // Index is already 0, and there are other tabs open. Choose the one on the right as the next open tab.
                                store.activeFilePreviewTabPath = store.filePreviewTabs[1].filePath
                            } else {
                                // There are no other tabs open
                                store.activeFilePreviewTabPath = undefined
                            }
                        }
                    }

                    store.filePreviewTabs = store.filePreviewTabs.filter(
                        (tab) => normalizeIdentifier(tab.filePath) !== normalizeIdentifier(path)
                    )

                    return store
                })
            },

            closeOtherTabs(path: string) {
                set((store) => {
                    store.filePreviewTabs = store.filePreviewTabs.filter(
                        (tab) => normalizeIdentifier(tab.filePath) === normalizeIdentifier(path)
                    )
                    store.activeFilePreviewTabPath = path
                    return store
                })
            },

            closeAllTabs() {
                set({
                    filePreviewTabs: [],
                    activeFilePreviewTabPath: undefined
                })
            }
        }))
    )
)
