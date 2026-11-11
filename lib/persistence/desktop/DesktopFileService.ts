import { IFileService, IFileServiceEvents } from "@/lib/core/persistence/IFileService"
import { IFileInfo } from "@/lib/core/persistence/IFileInfo"
import { IStorageQuota } from "@/lib/core/persistence/IStorageQuota"
import { IObservable } from "@/lib/core/IObservable"
import { Observable } from "@/lib/core/impl/Observable"
import { invokeCommand } from "@/lib/persistence/desktop/tauri"

/** `EntryInfo` returned by the Rust backend. */
interface RustEntryInfo {
    type: "file" | "directory"
    name: string
    path: string
}

/** `{ from, to }` pairs returned by the Rust backend for moves and deletes. */
interface RustPathChange {
    from: string
    to: string
}

/** `QuotaInfo` returned by the Rust backend. */
interface RustQuotaInfo {
    usedSpace: number
    totalSpace: number
    persistent: boolean
}

/**
 * Desktop file service backed by the native Rust backend (`novacrate-desktop`).
 *
 * The backend keeps the working copy of the crate in a temporary directory;
 * every mutating call writes the working copy back into the original crate
 * zip file before resolving. Paths are crate-relative (e.g.
 * `"myData/sample.csv"`).
 */
export class DesktopFileService implements IFileService {
    private _events = new Observable<IFileServiceEvents>()
    readonly events: IObservable<IFileServiceEvents> = this._events

    constructor(private crateId: string) {}

    async getContentList(): Promise<IFileInfo[]> {
        return await invokeCommand<RustEntryInfo[]>("list_crate_contents", {
            crateId: this.crateId
        })
    }

    async getInfo(path: string): Promise<IFileInfo> {
        return await invokeCommand<RustEntryInfo>("get_crate_file_info", {
            crateId: this.crateId,
            path
        })
    }

    async getFile(path: string): Promise<Blob> {
        const contents = await invokeCommand<ArrayBuffer>("read_file", {
            crateId: this.crateId,
            path
        })
        return new Blob([contents])
    }

    async addFile(path: string, content: Blob): Promise<void> {
        await this.writeFile(path, content)
        this._events.emit("file-created", path, content)
        await this.emitQuotaChanged()
    }

    async addFolder(path: string): Promise<void> {
        await invokeCommand("create_folder", { crateId: this.crateId, path })
        this._events.emit("folder-created", path)
    }

    async updateFile(path: string, content: Blob): Promise<void> {
        await this.writeFile(path, content)
        this._events.emit("file-updated", path, content)
        await this.emitQuotaChanged()
    }

    async move(src: string, dest: string): Promise<{ from: string; to: string }[]> {
        const impact = await invokeCommand<RustPathChange[]>("move_crate_entry", {
            crateId: this.crateId,
            src,
            dest
        })

        for (const entry of impact) {
            const isFolder = entry.from.endsWith("/")
            if (isFolder) {
                this._events.emit("folder-moved", entry.from, entry.to)
            } else {
                this._events.emit("file-moved", entry.from, entry.to)
            }
        }

        return impact
    }

    async delete(path: string): Promise<string[]> {
        const deleted = await invokeCommand<string[]>("delete_crate_entry", {
            crateId: this.crateId,
            path
        })

        for (const deletedItem of deleted) {
            const isFolder = deletedItem.endsWith("/")
            if (isFolder) {
                this._events.emit("folder-deleted", deletedItem)
            } else {
                this._events.emit("file-deleted", deletedItem)
            }
        }

        await this.emitQuotaChanged()
        return deleted
    }

    async getStorageQuota(): Promise<IStorageQuota> {
        return await invokeCommand<RustQuotaInfo>("get_crate_quota", { crateId: this.crateId })
    }

    /**
     * Write a blob through the backend. Both `addFile` and `updateFile` use
     * the same command; the backend re-zips the crate after every write.
     */
    private async writeFile(path: string, content: Blob): Promise<void> {
        const contents = new Uint8Array(await content.arrayBuffer())
        await invokeCommand("write_file", { crateId: this.crateId, path, contents })
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
