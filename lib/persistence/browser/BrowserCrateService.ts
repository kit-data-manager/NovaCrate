import { ICrateService, ICrateServiceEvents } from "@/lib/core/persistence/ICrateService"
import { IFileService } from "@/lib/core/persistence/IFileService"
import { IObservable } from "@/lib/core/IObservable"
import { Observable } from "@/lib/core/impl/Observable"
import { FunctionWorker } from "@/lib/function-worker"
import { opfsFunctions } from "@/lib/opfs-worker/functions"
import { BrowserFileService } from "@/lib/persistence/browser/BrowserFileService"

const METADATA_FILE = "ro-crate-metadata.json"

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
 */
export class BrowserCrateService implements ICrateService {
    private _events = new Observable<ICrateServiceEvents>()
    readonly events: IObservable<ICrateServiceEvents> = this._events

    private fileService: BrowserFileService

    constructor(crateId: string, worker: FunctionWorker<typeof opfsFunctions>) {
        this.fileService = new BrowserFileService(crateId, worker)
        this.fileService.events.addEventListener("file-updated", this.onFileUpdated)
    }

    private onFileUpdated = async (path: string, content: Blob) => {
        if (path === METADATA_FILE) {
            const metadata = await content.text()
            this._events.emit("metadata-changed", metadata)
        }
    }

    async getMetadata(): Promise<string> {
        // TODO cache
        const blob = await this.fileService.getFile(METADATA_FILE)
        return await blob.text()
    }

    async setMetadata(metadata: string): Promise<void> {
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
