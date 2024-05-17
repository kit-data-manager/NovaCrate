import { Download, Eye, EyeOff, X } from "lucide-react"
import HelpTooltip from "@/components/help-tooltip"
import { Button } from "@/components/ui/button"
import { createRef, useCallback, useContext, useEffect, useState } from "react"
import { FileExplorerContext } from "@/components/file-explorer/context"
import { CrateDataContext } from "@/components/crate-data-provider"
import { Error } from "@/components/error"
import { BaseViewer } from "@/components/file-explorer/viewers/base"

export function FilePreview() {
    const { previewingFilePath, setPreviewingFilePath, setDownloadError } =
        useContext(FileExplorerContext)
    const { serviceProvider, crateId } = useContext(CrateDataContext)
    const [previewNotSupported, setPreviewNotSupported] = useState(false)
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<Blob>()
    const [previewError, setPreviewError] = useState<unknown>()

    const downloadFile = useCallback(() => {
        if (serviceProvider) {
            serviceProvider.downloadFile(crateId, previewingFilePath).catch(setDownloadError)
        }
    }, [crateId, previewingFilePath, serviceProvider, setDownloadError])

    useEffect(() => {
        if (serviceProvider && serviceProvider.getCrateFileURL) {
            setLoading(true)
            setPreviewNotSupported(false)
            const url = serviceProvider.getCrateFileURL(crateId, previewingFilePath)
            fetch(url)
                .then(async (res) => {
                    const data = await res.blob()
                    setData(data)
                    setPreviewError(undefined)
                })
                .catch((e) => {
                    setPreviewError(e)
                })
                .finally(() => {
                    setLoading(false)
                })
        }
    }, [crateId, previewingFilePath, serviceProvider])

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
            <Error title="Could not load file for preview" error={previewError} />
            <BaseViewer
                setPreviewNotSupported={setPreviewNotSupported}
                previewNotSupported={previewNotSupported}
                loading={loading}
                data={data}
            />
        </div>
    )
}
