import { IFilePreviewTab, ViewerType } from "@/lib/state/file-explorer-state"
import { getFileName } from "@/lib/utils"

export type FileTreeNode = {
    id: string
    name: string
    children: FileTreeNode[]
    type: "folder" | "file"
}

export function getNameFromPath(path: string) {
    const split = path.split("/")
    if (path.endsWith("/")) {
        return split[split.length - 2]
    } else {
        return split[split.length - 1]
    }
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

export function determineViewerType(blob: Blob): ViewerType {
    if (UNSUPPORTED.includes(blob.type)) {
        return ViewerType.UNKNOWN
    } else if (IMAGE_TYPES.includes(blob.type)) {
        return ViewerType.IMAGE
    } else if (TEXT_TYPES.includes(blob.type)) {
        return ViewerType.TEXT
    } else if (IFRAME_TYPES.includes(blob.type)) {
        return ViewerType.IFRAME
    } else {
        return ViewerType.OBJECT
    }
}

export function makeFilePreviewTab(filePath: string): IFilePreviewTab {
    return {
        filePath,
        fileName: getFileName(filePath),
        viewerType: ViewerType.NOT_IDENTIFIED_YET
    }
}
