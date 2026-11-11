import { ICrateService, ICrateServiceEvents } from "@/lib/core/persistence/ICrateService"
import { IFileService } from "@/lib/core/persistence/IFileService"
import { IObservable } from "@/lib/core/IObservable"
import { Observable } from "@/lib/core/impl/Observable"
import { DesktopFileService } from "@/lib/persistence/desktop/DesktopFileService"
import { invokeCommand } from "@/lib/persistence/desktop/tauri"

const METADATA_FILE = "ro-crate-metadata.json"

/** How long a cached metadata value stays valid (ms). */
const CACHE_TTL_MS = 60000

/**
 * Desktop crate service backed by the native Rust backend.
 * Manages metadata read/write for a single local crate zip and owns its file
 * service.
 *
 * The backend extracts the crate zip into a temporary working directory when
 * the service is created ({@link ready} resolves once that finished) and
 * writes the working copy back into the original zip file after every
 * mutation.
 *
 * Mirrors `BrowserCrateService`: metadata results are cached for up to
 * {@link CACHE_TTL_MS} and external writes to `ro-crate-metadata.json` are
 * re-emitted as `"metadata-changed"`.
 */
export class DesktopCrateService implements ICrateService {
    private _events = new Observable<ICrateServiceEvents>()
    readonly events: IObservable<ICrateServiceEvents> = this._events

    private fileService: DesktopFileService
    private disposeListeners: () => void
    private disposed = false

    /** Cached metadata string and the timestamp (epoch ms) it was stored. */
    private metadataCache: { value: string; storedAt: number } | null = null

    /** Resolves once the backend extracted the crate into its working directory. */
    readonly ready: Promise<void>

    constructor(private crateId: string) {
        this.fileService = new DesktopFileService(crateId)
        this.disposeListeners = this.fileService.events.addEventListener(
            "file-updated",
            this.onFileUpdated
        )
        this.ready = invokeCommand<void>("open_crate", { crateId })
        // Prevent unhandled rejection warnings — callers awaiting `ready`
        // receive the error instead.
        this.ready.catch(() => {})
    }

    private invalidateCache(): void {
        this.metadataCache = null
    }

    private onFileUpdated = async (path: string, content: Blob) => {
        if (path === METADATA_FILE) {
            this.invalidateCache()
            const metadata = await content.text()
            this._events.emit("metadata-changed", metadata)
        }
    }

    /**
     * Wait until the backend has opened the crate. All file operations fail
     * with a descriptive error until then.
     */
    private async ensureReady(): Promise<void> {
        await this.ready
    }

    async getMetadata(): Promise<string> {
        await this.ensureReady()
        if (this.metadataCache && Date.now() - this.metadataCache.storedAt < CACHE_TTL_MS) {
            return this.metadataCache.value
        }

        const blob = await this.fileService.getFile(METADATA_FILE)
        const metadata = await blob.text()
        this.metadataCache = { value: metadata, storedAt: Date.now() }
        return metadata
    }

    async setMetadata(metadata: string): Promise<void> {
        await this.ensureReady()
        this.invalidateCache()
        await this.fileService.updateFile(
            METADATA_FILE,
            new Blob([metadata], { type: "application/json" })
        )
        // Now we rely on the file service to emit a "file-updated" event and
        // handle that in onFileUpdated
    }

    getFileService(): IFileService | null {
        return this.fileService
    }

    dispose() {
        this.disposeListeners()
        if (this.disposed) return
        this.disposed = true
        // The backend reference-counts sessions, so closing here only cleans
        // up the working copy once the last service for this crate is gone.
        invokeCommand("close_crate", { crateId: this.crateId }).catch((e) =>
            console.warn("Failed to close crate session", e)
        )
    }
}
