import { create } from "zustand"
import { unstable_ssrSafe as ssrSafe } from "zustand/middleware"

interface FileExplorerState {
    downloadError: unknown
    setDownloadError(e: unknown): void
    previewingFilePath: string
    setPreviewingFilePath(path: string): void
}

export const useFileExplorerState = create<FileExplorerState>()(
    ssrSafe((set) => ({
        downloadError: undefined,
        previewingFilePath: "",
        setPreviewingFilePath(path: string) {
            set({ previewingFilePath: path })
        },
        setDownloadError(e: unknown) {
            set({ downloadError: e })
        }
    }))
)
