import { Download, Eye, EyeOff, X } from "lucide-react"
import HelpTooltip from "@/components/help-tooltip"
import { Button } from "@/components/ui/button"
import { createRef, useCallback, useContext, useEffect, useState } from "react"
import { FileExplorerContext } from "@/components/file-explorer/context"
import { CrateDataContext } from "@/components/crate-data-provider"

export function FilePreview() {
    const { previewingFilePath, setPreviewingFilePath, setDownloadError } =
        useContext(FileExplorerContext)
    const { serviceProvider, crateId } = useContext(CrateDataContext)
    const [previewNotSupported, setPreviewNotSupported] = useState(false)
    const [loading, setLoading] = useState(true)

    const previewObject = createRef<HTMLObjectElement>()

    const handlePreviewObjectError = useCallback(() => {
        setPreviewNotSupported(true)
        setLoading(false)
    }, [])

    const handlePreviewObjectLoad = useCallback(() => {
        setPreviewNotSupported(false)
        setLoading(false)
    }, [])

    useEffect(() => {
        if (previewObject.current) {
            const node = previewObject.current
            node.addEventListener("error", handlePreviewObjectError)
            node.addEventListener("load", handlePreviewObjectLoad)

            return () => {
                node.removeEventListener("error", handlePreviewObjectError)
                node.removeEventListener("load", handlePreviewObjectLoad)
            }
        }
    }, [handlePreviewObjectError, handlePreviewObjectLoad, previewObject])

    useEffect(() => {
        setLoading(true)
    }, [previewingFilePath])

    const downloadFile = useCallback(() => {
        if (serviceProvider) {
            serviceProvider.downloadFile(crateId, previewingFilePath).catch(setDownloadError)
        }
    }, [crateId, previewingFilePath, serviceProvider, setDownloadError])

    return (
        <div className="flex flex-col h-full">
            <div className="pl-4 bg-accent text-sm h-10 flex items-center gap-2 shrink-0">
                <Eye className="w-4 h-4 shrink-0" /> File Preview
                <HelpTooltip>
                    <div>
                        Click on a file in the File Explorer to preview it here. Only supported for
                        some file types.
                    </div>
                </HelpTooltip>
            </div>
            <div className="flex gap-2 sticky top-0 z-10 p-2 bg-accent shrink-0 items-center">
                <Button size="sm" variant="outline" className="text-xs" onClick={downloadFile}>
                    <Download className={"w-4 h-4 mr-2"} /> Download File
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => setPreviewingFilePath("")}
                >
                    <X className={"w-4 h-4 mr-1"} /> Close Preview
                </Button>
                <div className="grow" />
                <div
                    className={
                        "text-muted-foreground transition " +
                        (loading ? "opacity-100" : "opacity-0")
                    }
                >
                    Loading...
                </div>
            </div>
            {previewNotSupported ? (
                <div className="grow flex justify-center items-center">
                    <div className="flex flex-col justify-center items-center p-10 text-center text-muted-foreground">
                        <EyeOff className="w-20 h-20" />
                        <div className="text-2xl py-4">Preview not available</div>
                        <div>
                            There is no preview available for this file type. Download it to view it
                            or select a different file to preview.
                        </div>
                    </div>
                </div>
            ) : null}
            {serviceProvider && serviceProvider.getCrateFileURL ? (
                <object
                    ref={previewObject}
                    className={"grow " + (previewNotSupported ? "hidden" : "")}
                    data={serviceProvider.getCrateFileURL(crateId, previewingFilePath)}
                />
            ) : (
                <div>No preview!</div>
            )}
        </div>
    )
}
