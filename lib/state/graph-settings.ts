import { persist } from "zustand/middleware"
import { create } from "zustand"
import { unstable_ssrSafe as ssrSafe } from "zustand/middleware"

export interface GraphSettings {
    aggregateProperties: boolean
    showTextProperties: boolean
    showEntityRules: boolean
    setAggregateProperties(val: boolean): void
    setShowTextProperties(val: boolean): void
    setShowEntityRules(val: boolean): void
}

export const useGraphSettings = create<GraphSettings>()(
    ssrSafe(
        persist(
            (set) => ({
                aggregateProperties: false,
                showTextProperties: false,
                showEntityRules: true,
                setAggregateProperties(val: boolean) {
                    set({ aggregateProperties: val })
                },
                setShowTextProperties(val: boolean) {
                    set({ showTextProperties: val })
                },
                setShowEntityRules(val: boolean) {
                    set({ showEntityRules: val })
                }
            }),
            {
                name: "graph-settings"
            }
        )
    )
)
