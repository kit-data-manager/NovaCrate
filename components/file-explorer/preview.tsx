import { Download, Eye, XIcon } from "lucide-react"
import HelpTooltip from "@/components/help-tooltip"
import { Button } from "@/components/ui/button"
import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { FileExplorerContext } from "@/components/file-explorer/context"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { Error } from "@/components/error"
import { BaseViewer } from "@/components/file-explorer/viewers/base"
import useSWR from "swr"

export function FilePreview() {
    const { previewingFilePath, setPreviewingFilePath, setDownloadError } =
        useContext(FileExplorerContext)
    const { serviceProvider, crateId } = useContext(CrateDataContext)
    const [previewNotSupported, setPreviewNotSupported] = useState(false)
    const [previewError, setPreviewError] = useState<unknown>()

    const downloadFile = useCallback(() => {
        if (serviceProvider) {
            serviceProvider.downloadFile(crateId, previewingFilePath).catch(setDownloadError)
        }
    }, [crateId, previewingFilePath, serviceProvider, setDownloadError])

    const resourceUrl = useMemo(() => {
        if (serviceProvider && serviceProvider.getCrateFileURL) {
            return serviceProvider.getCrateFileURL(crateId, previewingFilePath)
        } else return undefined
    }, [crateId, previewingFilePath, serviceProvider])

    const fileFetcher = useCallback(async (url: string) => {
        return await (await fetch(url)).blob()
    }, [])

    const { data, error, isLoading } = useSWR(resourceUrl, fileFetcher)

    useEffect(() => {
        setPreviewError("")
    }, [data])

    useEffect(() => {
        if (error) {
            setPreviewError(error)
        }
    }, [error])

    return (
        <div className="flex flex-col h-full">
            <div className="pl-4 pr-2 bg-accent text-sm h-10 flex items-center shrink-0">
                <Eye className="w-4 h-4 shrink-0 mr-2" /> File Preview
                <HelpTooltip className="ml-2">
                    <div>
                        Click on a file in the File Explorer to preview it here. Only supported for
                        some file types.
                    </div>
                </HelpTooltip>
                <div className="grow" />
                <Button variant="header" size="sm" onClick={downloadFile}>
                    <Download className="w-4 h-4" />
                </Button>
                <Button variant="header" size="sm" onClick={() => setPreviewingFilePath("")}>
                    <XIcon className="w-4 h-4" />
                </Button>
            </div>
            <Error title="Could not load file for preview" error={previewError} />
            <BaseViewer
                setPreviewNotSupported={setPreviewNotSupported}
                previewNotSupported={previewNotSupported}
                loading={isLoading}
                data={data}
            />
        </div>
    )
}
