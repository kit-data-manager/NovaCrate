import { createRef, useCallback, useEffect } from "react"
import { ViewerProps } from "@/components/file-explorer/viewers/base"
import { EyeOff } from "lucide-react"

export function ObjectViewer({
    data,
    setPreviewNotSupported,
    previewNotSupported,
    loading
}: ViewerProps) {
    const previewObject = createRef<HTMLObjectElement>()

    const handlePreviewObjectError = useCallback(() => {
        setPreviewNotSupported(true)
    }, [setPreviewNotSupported])

    const handlePreviewObjectLoad = useCallback(() => {
        setPreviewNotSupported(false)
    }, [setPreviewNotSupported])

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

    return (
        <>
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
            <object
                ref={previewObject}
                className={"grow " + (previewNotSupported || loading ? "hidden" : "")}
                data={URL.createObjectURL(data || new Blob([]))}
            />
        </>
    )
}
