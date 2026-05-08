import { ICrateService, ICrateServiceEvents } from "@/lib/core/persistence/ICrateService"
import { IFileService } from "@/lib/core/persistence/IFileService"
import { IObservable } from "@/lib/core/IObservable"
import { Observable } from "@/lib/core/impl/Observable"
import { FunctionWorker } from "@/lib/function-worker"
import { opfsFunctions } from "@/lib/opfs-worker/functions"
import { BrowserFileService } from "@/lib/persistence/browser/BrowserFileService"

const METADATA_FILE = "ro-crate-metadata.json"

/** How long a cached metadata value stays valid (ms). */
const CACHE_TTL_MS = 60000

/**
 * Browser-based crate service backed by OPFS.
 * Manages metadata read/write for a single crate and owns its file service.
 *
 * Metadata I/O is routed through {@link BrowserFileService} so that all file
 * access goes through a single code path. External writes to
 * `ro-crate-metadata.json` (e.g. from the JSON editor) are detected by
 * listening to the `"file-updated"` event on the file service and re-emitted
 * as `"metadata-changed"` so that {@link IPersistenceAdapter} can propagate
 * the change into the core layer.
 *
 * `getMetadata()` results are cached for up to {@link CACHE_TTL_MS}. The cache
 * is invalidated whenever `setMetadata()` is called or the underlying file is
 * changed externally (detected via the `"file-updated"` event).
 */
export class BrowserCrateService implements ICrateService {
    private _events = new Observable<ICrateServiceEvents>()
    readonly events: IObservable<ICrateServiceEvents> = this._events

    private fileService: BrowserFileService

    /** Cached metadata string and the timestamp (epoch ms) it was stored. */
    private metadataCache: { value: string; storedAt: number } | null = null

    constructor(crateId: string, worker: FunctionWorker<typeof opfsFunctions>) {
        this.fileService = new BrowserFileService(crateId, worker)
        this.fileService.events.addEventListener("file-updated", this.onFileUpdated)
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

    async getMetadata(): Promise<string> {
        if (this.metadataCache && Date.now() - this.metadataCache.storedAt < CACHE_TTL_MS) {
            return this.metadataCache.value
        }

        const blob = await this.fileService.getFile(METADATA_FILE)
        const metadata = await blob.text()
        this.metadataCache = { value: metadata, storedAt: Date.now() }
        return metadata
    }

    async setMetadata(metadata: string): Promise<void> {
        this.invalidateCache()
        await this.fileService.updateFile(
            METADATA_FILE,
            new Blob([metadata], { type: "application/json" })
        )
        // Now we rely on the file service to emit a "file-update" event and handle that in onFileUpdated
    }

    getFileService(): IFileService | null {
        return this.fileService
    }
}
