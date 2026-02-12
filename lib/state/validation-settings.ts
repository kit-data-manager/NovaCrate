import { create } from "zustand"
import { persist } from "zustand/middleware"
import { unstable_ssrSafe as ssrSafe } from "zustand/middleware"

export type ValidationSettings = {
    enabled: boolean
    setEnabled(enabled: boolean): void
}

export const validationSettings = create<ValidationSettings>()(
    ssrSafe(
        persist(
            (set) => ({
                enabled: true,
                setEnabled(enabled: boolean) {
                    set({ enabled })
                }
            }),
            {
                name: "validation-settings"
            }
        )
    )
)
