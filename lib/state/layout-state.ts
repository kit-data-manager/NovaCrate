import { unstable_ssrSafe as ssrSafe } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { create } from "zustand"

export interface LayoutState {
    showValidationDrawer: boolean
    setShowValidationDrawer(show: boolean): void

    showAIAssistant: boolean
    setShowAIAssistant(show: boolean): void
}

export const useLayoutState = create<LayoutState>()(
    ssrSafe(
        immer((set) => ({
            showValidationDrawer: false,
            setShowValidationDrawer(show: boolean) {
                set({ showValidationDrawer: show })
            },

            showAIAssistant: false,
            setShowAIAssistant(show: boolean) {
                set({ showAIAssistant: show })
            }
        }))
    )
)
