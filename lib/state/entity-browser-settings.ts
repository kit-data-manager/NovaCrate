import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface EntityBrowserSettings {
    showFolderStructure: boolean
    showEntityType: boolean
    showIdInsteadOfName: boolean
    showPropertyOverview: boolean

    setShowFolderStructure(val: boolean): void
    setShowEntityType(val: boolean): void
    setShowIdInsteadOfName(val: boolean): void
    setShowPropertyOverview(val: boolean): void
}

export const useEntityBrowserSettings = create<EntityBrowserSettings>()(
    persist(
        (set) => ({
            showFolderStructure: true,
            showEntityType: true,
            showIdInsteadOfName: false,
            showPropertyOverview: false,
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
