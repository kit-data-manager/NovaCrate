import { ObjectViewer } from "@/components/file-explorer/viewers/object"
import { ImageViewer } from "@/components/file-explorer/viewers/image"
import { TextViewer } from "@/components/file-explorer/viewers/text"
import { PreviewNotSupported } from "@/components/file-explorer/viewers/not-supported"
import { Eye } from "lucide-react"
import { useMemo } from "react"
import { IFrameViewer } from "@/components/file-explorer/viewers/iframe"

export interface ViewerProps {
    data?: Blob
    setPreviewNotSupported(val: boolean): void
    previewNotSupported: boolean
    loading: boolean
}

const UNSUPPORTED = ["application/octet-stream"]

const IMAGE_TYPES = [
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/x-icon",
    "image/svg+xml",
    "image/webp",
    "image/apng"
]
const TEXT_TYPES = ["text/plain", "application/json"]
const IFRAME_TYPES = ["text/html"]

const SAFARI_SUPPORTED_OBJECTS_TYPES = ["text/html"]

export function BaseViewer(props: ViewerProps) {
    const usesSafari = useMemo(() => {
        return navigator.userAgent.toLowerCase().includes("safari")
    }, [])

    if (!props.data)
        return (
            <div className="grow flex justify-center items-center">
                <div className="flex flex-col justify-center items-center p-10 text-center text-muted-foreground">
                    <Eye className="w-20 h-20" />
                    <div className="text-2xl py-4">File Preview</div>
                    <div>Select a file on the left to preview it here</div>
                </div>
            </div>
        )

    if (UNSUPPORTED.includes(props.data.type)) {
        return <PreviewNotSupported />
    } else if (IFRAME_TYPES.includes(props.data.type)) {
        return <IFrameViewer {...props} />
    } else if (IMAGE_TYPES.includes(props.data.type)) {
        return <ImageViewer {...props} />
    } else if (TEXT_TYPES.includes(props.data.type)) {
        return <TextViewer {...props} />
    } else if (!usesSafari || SAFARI_SUPPORTED_OBJECTS_TYPES.includes(props.data.type)) {
        return <ObjectViewer {...props} />
    } else {
        return <PreviewNotSupported />
    }
}
