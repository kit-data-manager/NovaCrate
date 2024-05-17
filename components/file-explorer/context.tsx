import { createContext, useState } from "react"

interface IFileExplorerContext {
    downloadError: unknown
    setDownloadError(e: unknown): void
    previewingFilePath: string
    setPreviewingFilePath(path: string): void
}

export const FileExplorerContext = createContext<IFileExplorerContext>({
    downloadError: undefined,
    setDownloadError() {
        throw "File Explorer Context not mounted"
    },
    previewingFilePath: "",
    setPreviewingFilePath() {
        throw "File Explorer Context not mounted"
    }
})

export function FileExplorerProvider({ children }: { children: React.ReactNode }) {
    const [previewingFilePath, setPreviewingFilePath] = useState("")
    const [downloadError, setDownloadError] = useState<unknown>()

    return (
        <FileExplorerContext.Provider
            value={{
                previewingFilePath,
                setPreviewingFilePath,
                downloadError,
                setDownloadError
            }}
        >
            {children}
        </FileExplorerContext.Provider>
    )
}
