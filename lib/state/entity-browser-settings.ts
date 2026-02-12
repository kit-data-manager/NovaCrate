import { create } from "zustand"
import { persist } from "zustand/middleware"
import { unstable_ssrSafe as ssrSafe } from "zustand/middleware"

export interface EntityBrowserSettings {
    showEntityType: boolean
    showIdInsteadOfName: boolean
    showPropertyOverview: boolean
    setShowEntityType(val: boolean): void
    setShowIdInsteadOfName(val: boolean): void
    setShowPropertyOverview(val: boolean): void

    sortBy: "name" | "type" | "id"
    setSortBy(sortBy: "name" | "type" | "id"): void

    structureBy: "none" | "general-type" | "@type"
    setStructureBy(structureBy: "none" | "general-type" | "@type"): void
}

export const useEntityBrowserSettings = create<EntityBrowserSettings>()(
    ssrSafe(
        persist(
            (set) => ({
                showEntityType: true,
                showIdInsteadOfName: false,
                showPropertyOverview: false,
                setShowEntityType(val: boolean) {
                    set({ showEntityType: val })
                },
                setShowIdInsteadOfName(val: boolean) {
                    set({ showIdInsteadOfName: val })
                },
                setShowPropertyOverview(val: boolean) {
                    set({ showPropertyOverview: val })
                },

                sortBy: "name",
                setSortBy(sortBy: "name" | "type" | "id") {
                    set({ sortBy })
                },

                structureBy: "general-type",
                setStructureBy(structureBy: "none" | "general-type" | "@type") {
                    set({ structureBy })
                }
            }),
            {
                name: "entity-browser"
            }
        )
    )
)
