import { persist, unstable_ssrSafe as ssrSafe } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { create } from "zustand"

export type TourOrigin = "main-menu" | "editor"

export interface TourState {
    tourActive: boolean
    tourOrigin: TourOrigin | null

    hasSeenTour: boolean

    startTour(origin: TourOrigin): void
    stopTour(): void
    finishTour(): void
}

export const useTourState = create<TourState>()(
    ssrSafe(
        persist(
            immer((set) => ({
                tourActive: false,
                tourOrigin: null,

                hasSeenTour: false,

                startTour(origin: TourOrigin) {
                    set({
                        tourActive: true,
                        tourOrigin: origin
                    })
                },

                stopTour() {
                    set({
                        tourActive: false,
                        tourOrigin: null
                    })
                },

                finishTour() {
                    set({
                        tourActive: false,
                        tourOrigin: null,
                        hasSeenTour: true
                    })
                }
            })),
            {
                name: "tour-state",
                partialize: (state) => ({ hasSeenTour: state.hasSeenTour })
            }
        )
    )
)
