import { IStorageQuota } from "@/lib/core/persistence/IStorageQuota"
import { IFileInfo } from "@/lib/core/persistence/IFileInfo"
import { IObservable } from "@/lib/core/IObservable"

export type IFileServiceEvents = {
    /** Fired after a new file is created at `path`. */
    "file-created": (path: string) => void
    /** Fired after the contents of an existing file at `path` are replaced. */
    "file-updated": (path: string) => void
    /** Fired after a file at `path` is removed. */
    "file-deleted": (path: string) => void
    /** Fired after a file is renamed/moved; `path` is the new destination. */
    "file-moved": (path: string) => void
    /** Fired after a new directory is created at `path`. */
    "folder-created": (path: string) => void
    /** Fired after a directory at `path` is removed. */
    "folder-deleted": (path: string) => void
    /** Fired after a directory is renamed/moved; `path` is the new destination. */
    "folder-moved": (path: string) => void
    /** Fired when the measured storage usage changes. */
    "quota-changed": (quota: IStorageQuota) => void
}

/**
 * File-system operations scoped to a single open crate. Persistence implementations are not
 * required to implement this interface.
 *
 * Paths are relative to the crate root (e.g. `"myData/sample.csv"`, `"./ro-crate-metadata.json"`). All
 * operations emit granular events so that the UI and core layer can react
 * to changes without polling.
 *
 * Obtained via {@link ICrateService.getFileService}. Consumed by
 * {@link ICoreService} for data-entity file operations, and directly by UI
 * components that need to browse or download crate files.
 */
export interface IFileService {
    readonly events: IObservable<IFileServiceEvents>

    /** Return a flat list of all files and directories inside the crate. */
    getContentList(): Promise<IFileInfo[]>
    /**
     * Return file information for a single file/directory at `path`.
     * @param path - Crate-relative path of the file or directory.
     */
    getInfo(path: string): Promise<IFileInfo>
    /**
     * Read the raw bytes of the file at `path` as a {@link Blob}.
     * @param path - Crate-relative path of the file.
     */
    getFile(path: string): Promise<Blob>
    /**
     * Write `content` to `path`, creating the file (and any missing parent
     * directories). Emits `"file-created"` via {@link IFileService.events}.
     * @param path - Crate-relative destination path.
     * @param content - File bytes to write.
     */
    addFile(path: string, content: Blob): Promise<void>
    /**
     * Create an empty directory at `path`.
     * Emits `"folder-created"` via {@link IFileService.events}.
     * @param path - Crate-relative path of the new directory.
     */
    addFolder(path: string): Promise<void>
    /**
     * Replace the contents of an existing file at `path`.
     * Emits `"file-updated"` via {@link IFileService.events}.
     * @param path - Crate-relative path of the file to update.
     * @param content - New file bytes.
     */
    updateFile(path: string, content: Blob): Promise<void>
    /**
     * Move (rename) a file or directory from `src` to `dest`. Emits
     * `"file-moved"` or `"folder-moved"` via {@link IFileService.events}.
     * @param src - Crate-relative source path.
     * @param dest - Crate-relative destination path.
     */
    move(src: string, dest: string): Promise<void>
    /**
     * Delete a file or directory (recursively) at `path`. Emits
     * `"file-deleted"` or `"folder-deleted"` via {@link IFileService.events}.
     * @param path - Crate-relative path of the file or directory to remove.
     */
    delete(path: string): Promise<void>
    /** Return the current storage quota and usage for the current persistence implementation. */
    getStorageQuota(): Promise<IStorageQuota>
}
