import { createStore } from "zustand/vanilla"
import { persist } from "zustand/middleware"

export interface GraphSettings {
    aggregateProperties: boolean
    showTextProperties: boolean
    setAggregateProperties(val: boolean): void
    setShowTextProperties(val: boolean): void
}

export const createGraphSettings = () =>
    createStore<GraphSettings>()(
        persist(
            (set) => ({
                aggregateProperties: false,
                showTextProperties: false,
                setAggregateProperties(val: boolean) {
                    set({ aggregateProperties: val })
                },
                setShowTextProperties(val: boolean) {
                    set({ showTextProperties: val })
                }
            }),
            {
                name: "graph-settings"
            }
        )
    )
