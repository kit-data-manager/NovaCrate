import { IFilePreviewTab } from "@/lib/state/file-explorer-state"
import { getFileName } from "@/lib/utils"
import { VIEWERS, ViewerType } from "@/lib/file-preview"

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

export function determineViewerType(blob: Blob): ViewerType {
    console.log(blob.type)
    if (UNSUPPORTED.includes(blob.type)) {
        return ViewerType.UNKNOWN
    } else {
        for (const v of VIEWERS) {
            if (v.mimeTypes.includes(blob.type)) {
                return v.type
            }
        }

        return ViewerType.UNKNOWN
    }
}

export function makeFilePreviewTab(filePath: string): IFilePreviewTab {
    return {
        filePath,
        fileName: getFileName(filePath),
        viewerType: ViewerType.NOT_IDENTIFIED_YET
    }
}
