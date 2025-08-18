import { create } from "zustand"
import { persist } from "zustand/middleware"

export type ValidationSettings = {
    enabled: boolean
    setEnabled(enabled: boolean): void
}

export const validationSettings = create<ValidationSettings>()(
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
