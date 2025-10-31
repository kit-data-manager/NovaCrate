import { createStore } from "zustand/vanilla"
import { persist } from "zustand/middleware"

export interface GlobalSettings {
    // Hint that is shown some time after starting to use NovaCrate. Informs the user that their data is saved only locally and they have to take care of backing it up.
    acceptedDataSaveHint: number | null
    setAcceptedDataSaveHint(dateAndTime: number): void
}

export const createGlobalSettings = () =>
    createStore<GlobalSettings>()(
        persist(
            (set) => ({
                acceptedDataSaveHint: null,
                setAcceptedDataSaveHint(dateAndTime: number) {
                    set({ acceptedDataSaveHint: dateAndTime })
                }
            }),
            {
                name: "global-settings"
            }
        )
    )
