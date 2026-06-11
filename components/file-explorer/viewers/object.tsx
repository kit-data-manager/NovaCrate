import { createRef, useCallback, useEffect, useState } from "react"
import { LargeViewSelect } from "@/components/file-explorer/viewers/large-view-select"
import { ViewerProps, ViewerType } from "@/lib/file-preview"

export function ObjectViewer({ data, tab, updateTab }: ViewerProps) {
    const previewObject = createRef<HTMLObjectElement>()
    const [previewNotSupported, setPreviewNotSupported] = useState(false)
    const [url, setUrl] = useState<string>()

    useEffect(() => {
        const newUrl = URL.createObjectURL(data || new Blob([]))
        setUrl(newUrl)

        return () => URL.revokeObjectURL(newUrl)
    }, [data])

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

    const updateType = useCallback(
        (type: ViewerType) => {
            updateTab({
                ...tab,
                viewerType: type
            })
        },
        [tab, updateTab]
    )

    return (
        <>
            {previewNotSupported ? (
                <LargeViewSelect exclude={[ViewerType.OBJECT]} setType={updateType} />
            ) : null}
            <object
                ref={previewObject}
                className={"grow w-full h-full " + (previewNotSupported || !data ? "hidden" : "")}
                data={url}
            />
        </>
    )
}
