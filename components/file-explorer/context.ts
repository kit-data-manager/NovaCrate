import { createContext } from "react"

interface IFileExplorerContext {
    previewingFilePath: string
    setPreviewingFilePath(path: string): void
}

export const FileExplorerContext = createContext<IFileExplorerContext>({
    previewingFilePath: "",
    setPreviewingFilePath() {
        throw "File Explorer Context not mounted"
    }
})
