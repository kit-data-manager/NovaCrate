import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface EntityBrowserState {
    showFolderStructure: boolean
    showEntityType: boolean
    showIdInsteadOfName: boolean
    showPropertyOverview: boolean

    setShowFolderStructure(val: boolean): void
    setShowEntityType(val: boolean): void
    setShowIdInsteadOfName(val: boolean): void
    setShowPropertyOverview(val: boolean): void
}

export const useEntityBrowserState = create<EntityBrowserState>()(
    persist(
        (set) => ({
            showFolderStructure: true,
            showEntityType: true,
            showIdInsteadOfName: false,
            showPropertyOverview: true,
            setShowEntityType(val: boolean) {
                set({ showEntityType: val })
            },
            setShowFolderStructure(val: boolean) {
                set({ showFolderStructure: val })
            },
            setShowIdInsteadOfName(val: boolean) {
                set({ showIdInsteadOfName: val })
            },
            setShowPropertyOverview(val: boolean) {
                set({ showPropertyOverview: val })
            }
        }),
        {
            name: "entity-browser"
        }
    )
)
