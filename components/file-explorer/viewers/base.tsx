import { ObjectViewer } from "@/components/file-explorer/viewers/object"
import { ImageViewer } from "@/components/file-explorer/viewers/image"
import { TextViewer } from "@/components/file-explorer/viewers/text"

export interface ViewerProps {
    data?: Blob
    setPreviewNotSupported(val: boolean): void
    previewNotSupported: boolean
    loading: boolean
}

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
    if (!props.data) return null

    if (IMAGE_TYPES.includes(props.data.type)) {
        return <ImageViewer {...props} />
    } else if (TEXT_TYPES.includes(props.data.type)) {
        return <TextViewer {...props} />
    } else {
        return <ObjectViewer {...props} />
    }
}
