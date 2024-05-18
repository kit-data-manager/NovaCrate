import { createRef, useCallback, useEffect } from "react"
import { ViewerProps } from "@/components/file-explorer/viewers/base"
import { EyeOff } from "lucide-react"
import { PreviewNotSupported } from "@/components/file-explorer/viewers/not-supported"

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
            {previewNotSupported ? <PreviewNotSupported /> : null}
            <object
                ref={previewObject}
                className={"grow " + (previewNotSupported || loading ? "hidden" : "")}
                data={URL.createObjectURL(data || new Blob([]))}
            />
        </>
    )
}
