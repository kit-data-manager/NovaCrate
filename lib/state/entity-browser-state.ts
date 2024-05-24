import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface EntityBrowserState {
    showFolderStructure: boolean
    showEntityType: boolean
    showIdInsteadOfName: boolean

    setShowFolderStructure(val: boolean): void
    setShowEntityType(val: boolean): void
    setShowIdInsteadOfName(val: boolean): void
}

export const useEntityBrowserState = create<EntityBrowserState>()(
    persist(
        (set) => ({
            showFolderStructure: true,
            showEntityType: true,
            showIdInsteadOfName: false,
            setShowEntityType(val: boolean) {
                set({ showEntityType: val })
            },
            setShowFolderStructure(val: boolean) {
                set({ showFolderStructure: val })
            },
            setShowIdInsteadOfName(val: boolean) {
                set({ showIdInsteadOfName: val })
            }
        }),
        {
            name: "entity-browser"
        }
    )
)
