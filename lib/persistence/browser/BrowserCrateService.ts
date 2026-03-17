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
 */
export class BrowserCrateService implements ICrateService {
    private _events = new Observable<ICrateServiceEvents>()
    readonly events: IObservable<ICrateServiceEvents> = this._events

    private fileService: BrowserFileService

    constructor(
        private crateId: string,
        private worker: FunctionWorker<typeof opfsFunctions>
    ) {
        this.fileService = new BrowserFileService(crateId, worker)
    }

    async getMetadata(): Promise<string> {
        const blob = await this.worker.execute("readFile", this.crateId, METADATA_FILE)
        return await blob.text()
    }

    async setMetadata(metadata: string): Promise<void> {
        const data = new TextEncoder().encode(metadata)
        await this.worker.executeTransfer(
            "writeFile",
            [data.buffer],
            this.crateId,
            METADATA_FILE,
            data
        )
        this._events.emit("metadata-changed", metadata)
    }

    getFileService(): IFileService | null {
        return this.fileService
    }
}
