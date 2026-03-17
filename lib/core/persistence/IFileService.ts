import { IStorageQuota } from "@/lib/core/persistence/IStorageQuota"
import { IFileInfo } from "@/lib/core/persistence/IFileInfo"
import { IObservable } from "@/lib/core/IObservable"

export type IFileServiceEvents = {
    "file-created": (path: string) => void
    "file-updated": (path: string) => void
    "file-deleted": (path: string) => void
    "file-moved": (path: string) => void
    "folder-created": (path: string) => void
    "folder-deleted": (path: string) => void
    "folder-moved": (path: string) => void
    "quota-changed": (quota: IStorageQuota) => void
}

export interface IFileService {
    readonly events: IObservable<IFileServiceEvents>

    getContentList(): Promise<IFileInfo[]>
    getInfo(path: string): Promise<IFileInfo>
    getFile(path: string): Promise<Blob>
    addFile(path: string, content: Blob): Promise<void>
    addFolder(path: string): Promise<void>
    updateFile(path: string, content: Blob): Promise<void>
    move(src: string, dest: string): Promise<void>
    delete(path: string): Promise<void>
    getStorageQuota(): Promise<IStorageQuota>
}
