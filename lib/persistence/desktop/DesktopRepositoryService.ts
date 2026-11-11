import {
    IRepositoryService,
    IRepositoryServiceEvents
} from "@/lib/core/persistence/IRepositoryService"
import { IStorageQuota } from "@/lib/core/persistence/IStorageQuota"
import { IObservable } from "@/lib/core/IObservable"
import { Observable } from "@/lib/core/impl/Observable"
import { invokeCommand } from "@/lib/persistence/desktop/tauri"

/** `QuotaInfo` returned by the Rust backend. */
interface RustQuotaInfo {
    usedSpace: number
    totalSpace: number
    persistent: boolean
}

/** localStorage key for the list of recently opened crate zip paths. */
const RECENT_CRATES_KEY = "novacrate-desktop-recent-crates"

/** Maximum number of recent crates to remember. */
const MAX_RECENT_CRATES = 20

function readRecents(): string[] {
    if (typeof window === "undefined") return []
    try {
        const raw = window.localStorage.getItem(RECENT_CRATES_KEY)
        const parsed = raw ? JSON.parse(raw) : []
        return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : []
    } catch (e) {
        console.warn("Failed to read recent crates", e)
        return []
    }
}

function writeRecents(recents: string[]): void {
    try {
        window.localStorage.setItem(RECENT_CRATES_KEY, JSON.stringify(recents))
    } catch (e) {
        console.warn("Failed to store recent crates", e)
    }
}

/**
 * Desktop repository service backed by the native Rust backend.
 *
 * There is no central crate storage on the desktop: the crate ID *is* the
 * path of a local crate zip file. The repository therefore keeps a recents
 * list of opened crate paths in `localStorage` instead of listing a
 * directory, and crates created via {@link createCrateFromZip} /
 * {@link createCrateFromMetadata} are written to a default directory by the
 * backend (`~/Documents/NovaCrate`).
 */
export class DesktopRepositoryService implements IRepositoryService {
    private _events = new Observable<IRepositoryServiceEvents>()
    readonly events: IObservable<IRepositoryServiceEvents> = this._events

    async getCratesList(): Promise<string[]> {
        const recents = readRecents()
        const existing: string[] = []
        for (const crateId of recents) {
            const exists = await invokeCommand<boolean>("crate_exists", { crateId })
            if (exists) existing.push(crateId)
        }
        return existing
    }

    async createCrateFromZip(zip: Blob): Promise<string> {
        const bytes = new Uint8Array(await zip.arrayBuffer())
        const crateId = await invokeCommand<string>("create_crate_from_zip_bytes", {
            bytes,
            destDir: null
        })
        this.addRecent(crateId)
        this._events.emit("crate-created", crateId)
        this._events.emit("crates-list-changed")
        return crateId
    }

    async createCrateFromMetadata(metadata: string): Promise<string> {
        const crateId = await invokeCommand<string>("create_crate_from_metadata", {
            metadata,
            destDir: null
        })
        this.addRecent(crateId)
        this._events.emit("crate-created", crateId)
        this._events.emit("crates-list-changed")
        return crateId
    }

    async deleteCrate(crateId: string): Promise<void> {
        await invokeCommand("delete_crate_file", { crateId })
        this.removeRecent(crateId)
        this._events.emit("crate-deleted", crateId)
        this._events.emit("crates-list-changed")
    }

    async deleteAllCrates(): Promise<void> {
        for (const crateId of readRecents()) {
            try {
                await this.deleteCrate(crateId)
            } catch (e) {
                console.warn(`Failed to delete crate ${crateId}`, e)
            }
        }
        this._events.emit("crates-list-changed")
    }

    async getCrateAs(
        crateId: string,
        format: "zip" | "eln" | "standalone-json",
        options?: { compressed?: boolean }
    ): Promise<Blob> {
        const bytes = await invokeCommand<ArrayBuffer>("export_crate", {
            crateId,
            format,
            compressed: options?.compressed ?? null
        })
        const mime =
            format === "eln"
                ? "application/vnd.eln+zip"
                : format === "standalone-json"
                  ? "application/ld+json"
                  : "application/zip"
        return new Blob([bytes], { type: mime })
    }

    async getStorageQuota(): Promise<IStorageQuota> {
        return await invokeCommand<RustQuotaInfo>("repository_quota", { destDir: null })
    }

    /** Record a crate path in the recents list (most recent first). */
    addRecent(crateId: string): void {
        const recents = readRecents().filter((id) => id !== crateId)
        recents.unshift(crateId)
        writeRecents(recents.slice(0, MAX_RECENT_CRATES))
    }

    /** Remove a crate path from the recents list. */
    removeRecent(crateId: string): void {
        writeRecents(readRecents().filter((id) => id !== crateId))
    }
}
