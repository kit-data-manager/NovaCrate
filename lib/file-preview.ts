import { ComponentType } from "react"
import { ImageViewer } from "@/components/file-explorer/viewers/image"
import { TextViewer } from "@/components/file-explorer/viewers/text"
import { ObjectViewer } from "@/components/file-explorer/viewers/object"
import { IFrameViewer } from "@/components/file-explorer/viewers/iframe"
import { IFilePreviewTab } from "@/lib/state/file-explorer-state"

export enum ViewerType {
    UNKNOWN,
    IMAGE,
    TEXT,
    OBJECT,
    IFRAME,
    NOT_IDENTIFIED_YET = 999
}

export interface ViewerProps {
    tab: IFilePreviewTab
    data: Blob | undefined
}

export interface IViewer {
    type: ViewerType
    displayName: string
    subtitle?: string
    mimeTypes: string[]
    component: ComponentType<ViewerProps>
}

export const VIEWERS: IViewer[] = [
    {
        type: ViewerType.IMAGE,
        displayName: "Image Viewer",
        mimeTypes: [
            "image/png",
            "image/jpeg",
            "image/gif",
            "image/x-icon",
            "image/webp",
            "image/apng"
        ],
        component: ImageViewer
    },
    {
        type: ViewerType.TEXT,
        displayName: "Text Viewer",
        mimeTypes: ["text/plain", "application/json"],
        component: TextViewer
    },
    {
        type: ViewerType.OBJECT,
        displayName: "Object Viewer",
        subtitle: "(e.g. for PDFs)",
        mimeTypes: ["application/pdf"],
        component: ObjectViewer
    },
    {
        type: ViewerType.IFRAME,
        displayName: "IFrame Viewer",
        subtitle: "(e.g. for HTML)",
        mimeTypes: ["text/html"],
        component: IFrameViewer
    }
]
