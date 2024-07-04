import { create } from "zustand"

interface FileExplorerState {
    downloadError: unknown
    setDownloadError(e: unknown): void
    previewingFilePath: string
    setPreviewingFilePath(path: string): void
}

export const useFileExplorerState = create<FileExplorerState>()((set) => ({
    downloadError: undefined,
    previewingFilePath: "",
    setPreviewingFilePath(path: string) {
        set({ previewingFilePath: path })
    },
    setDownloadError(e: unknown) {
        set({ downloadError: e })
    }
}))
