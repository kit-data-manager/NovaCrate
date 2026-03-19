import { IFileService, IFileServiceEvents } from "@/lib/core/persistence/IFileService"
import { IFileInfo } from "@/lib/core/persistence/IFileInfo"
import { IStorageQuota } from "@/lib/core/persistence/IStorageQuota"
import { IObservable } from "@/lib/core/IObservable"
import { Observable } from "@/lib/core/impl/Observable"
import { FunctionWorker } from "@/lib/function-worker"
import { opfsFunctions } from "@/lib/opfs-worker/functions"

/**
 * Browser-based file service backed by OPFS.
 * Manages file and folder operations for a single crate.
 */
export class BrowserFileService implements IFileService {
    private _events = new Observable<IFileServiceEvents>()
    readonly events: IObservable<IFileServiceEvents> = this._events

    constructor(
        private crateId: string,
        private worker: FunctionWorker<typeof opfsFunctions>
    ) {}

    async getContentList(): Promise<IFileInfo[]> {
        const paths = await this.worker.execute("getCrateDirContents", this.crateId)
        return paths.map((path) => {
            const isDirectory = path.endsWith("/")
            // Strip trailing "/" from directory paths so we can extract the name.
            // Without this, "images/".split("/").pop() would return "" instead of "images".
            const normalizedPath = isDirectory ? path.slice(0, -1) : path
            const name = normalizedPath.split("/").pop() ?? normalizedPath
            return {
                type: isDirectory ? "directory" : "file",
                name: name,
                path
            } satisfies IFileInfo
        })
    }

    async getInfo(path: string): Promise<IFileInfo> {
        const info = await this.worker.execute("getFileInfo", this.crateId, path)
        return { type: info.type, name: info.name, path }
    }

    async getFile(path: string): Promise<Blob> {
        return await this.worker.execute("readFile", this.crateId, path)
    }

    async addFile(path: string, content: Blob): Promise<void> {
        await this.worker.execute("writeFile", this.crateId, path, content)
        this._events.emit("file-created", path, content)
        await this.emitQuotaChanged()
    }

    async addFolder(path: string): Promise<void> {
        await this.worker.execute("createFolder", this.crateId, path)
        this._events.emit("folder-created", path)
    }

    async updateFile(path: string, content: Blob): Promise<void> {
        await this.worker.execute("writeFile", this.crateId, path, content)
        this._events.emit("file-updated", path, content)
        await this.emitQuotaChanged()
    }

    async move(src: string, dest: string): Promise<void> {
        await this.worker.execute("moveFileOrFolder", this.crateId, src, dest)
        const isFolder = src.endsWith("/")
        if (isFolder) {
            this._events.emit("folder-moved", dest)
        } else {
            this._events.emit("file-moved", dest)
        }
    }

    async delete(path: string): Promise<void> {
        // TODO emit delete event for all files that are recursively deleted on folder delete?
        const isFolder = path.endsWith("/")
        await this.worker.execute("deleteFileOrFolder", this.crateId, path)
        if (isFolder) {
            this._events.emit("folder-deleted", path)
        } else {
            this._events.emit("file-deleted", path)
        }
        await this.emitQuotaChanged()
    }

    async getStorageQuota(): Promise<IStorageQuota> {
        const info = await this.worker.execute("getStorageInfo")
        return {
            usedSpace: info.usedSpace,
            totalSpace: info.totalSpace,
            persistent: info.persistent
        }
    }

    private async emitQuotaChanged() {
        try {
            const quota = await this.getStorageQuota()
            this._events.emit("quota-changed", quota)
        } catch (e) {
            console.warn("Failed to emit quota change", e)
        }
    }
}
