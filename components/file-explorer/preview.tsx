"use client"

import { Download, Eye, FileIcon, XIcon } from "lucide-react"
import HelpTooltip from "@/components/help-tooltip"
import { Button } from "@/components/ui/button"
import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { Error } from "@/components/error"
import { BaseViewer } from "@/components/file-explorer/viewers/base"
import useSWR from "swr"

export function FilePreview({
    doubleHeight = false,
    closeable = true,
    previewingFilePath,
    setPreviewingFilePath,
    setDownloadError
}: {
    doubleHeight?: boolean
    closeable?: boolean
    previewingFilePath: string
    setPreviewingFilePath(path: string): void
    setDownloadError(e: unknown): void
}) {
    const { serviceProvider, crateId } = useContext(CrateDataContext)
    const [previewNotSupported, setPreviewNotSupported] = useState(false)
    const [previewError, setPreviewError] = useState<unknown>()

    const downloadFile = useCallback(() => {
        if (serviceProvider && crateId) {
            serviceProvider.downloadFile(crateId, previewingFilePath).catch(setDownloadError)
        }
    }, [crateId, previewingFilePath, serviceProvider, setDownloadError])

    const resourceUrl = useMemo(() => {
        if (serviceProvider && serviceProvider.getCrateFileURL && crateId && previewingFilePath) {
            return serviceProvider.getCrateFileURL(crateId, previewingFilePath)
        } else return undefined
    }, [crateId, previewingFilePath, serviceProvider])

    const fileFetcher = useCallback(async (url: string) => {
        const req = await fetch(url)
        if (req.ok) {
            return await req.blob()
        } else {
            return new Blob([], { type: "text/x-unsupported" })
        }
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
                <Eye className="w-4 h-4 shrink-0 mr-2" />{" "}
                <span className="shrink-0">File Preview</span>
                <HelpTooltip className="ml-2">
                    <div>
                        Click on a file in the File Explorer to preview it here. Only supported for
                        some file types.
                    </div>
                </HelpTooltip>
                {doubleHeight ? null : (
                    <div className="self-center text-sm pl-2 flex items-center truncate text-muted-foreground">
                        <span className="truncate">{previewingFilePath}</span>
                    </div>
                )}
                <div className="grow" />
                {doubleHeight ? null : (
                    <>
                        {previewingFilePath ? (
                            <Button variant="header" size="sm" onClick={downloadFile}>
                                <Download className="w-4 h-4 mr-2" /> Download
                            </Button>
                        ) : null}
                        {closeable ? (
                            <Button
                                variant="header"
                                size="sm"
                                onClick={() => setPreviewingFilePath("")}
                            >
                                <XIcon className="w-4 h-4" />
                            </Button>
                        ) : null}
                    </>
                )}
            </div>
            {doubleHeight ? (
                <div className="flex p-2 gap-2 bg-accent">
                    <div className="self-center text-sm pl-2 flex items-center truncate">
                        <FileIcon className="w-4 h-4 mr-2 shrink-0" /> {previewingFilePath}
                    </div>
                    <div className="grow" />
                    {previewingFilePath ? (
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={downloadFile}
                        >
                            <Download className="w-4 h-4 mr-2" /> Download
                        </Button>
                    ) : null}
                    {closeable ? (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewingFilePath("")}
                        >
                            <XIcon className="w-4 h-4" />
                        </Button>
                    ) : null}
                </div>
            ) : null}
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
