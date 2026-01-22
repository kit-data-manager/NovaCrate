import { create } from "zustand"
import { persist } from "zustand/middleware"
import { unstable_ssrSafe as ssrSafe } from "zustand/middleware"

interface FileExplorerSettings {
    showEntities: boolean
    toggleShowEntities: () => void
}

export const fileExplorerSettings = create<FileExplorerSettings>()(
    ssrSafe(
        persist(
            (set, get) => ({
                showEntities: false,
                toggleShowEntities: () => {
                    set({ showEntities: !get().showEntities })
                }
            }),
            { name: "file-explorer-settings" }
        )
    )
)
