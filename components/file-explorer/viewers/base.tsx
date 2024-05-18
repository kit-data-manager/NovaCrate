import { ObjectViewer } from "@/components/file-explorer/viewers/object"
import { ImageViewer } from "@/components/file-explorer/viewers/image"
import { TextViewer } from "@/components/file-explorer/viewers/text"
import { PreviewNotSupported } from "@/components/file-explorer/viewers/not-supported"

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

export function BaseViewer(props: ViewerProps) {
    if (!props.data) return <PreviewNotSupported />

    if (UNSUPPORTED.includes(props.data.type)) {
        return <PreviewNotSupported />
    } else if (IMAGE_TYPES.includes(props.data.type)) {
        return <ImageViewer {...props} />
    } else if (TEXT_TYPES.includes(props.data.type)) {
        return <TextViewer {...props} />
    } else {
        return <ObjectViewer {...props} />
    }
}
