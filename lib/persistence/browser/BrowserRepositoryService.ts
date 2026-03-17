import {
    IRepositoryService,
    IRepositoryServiceEvents,
    StoredCrate
} from "@/lib/core/persistence/IRepositoryService"
import { IStorageQuota } from "@/lib/core/persistence/IStorageQuota"
import { IObservable } from "@/lib/core/IObservable"
import { Observable } from "@/lib/core/impl/Observable"
import { FunctionWorker } from "@/lib/function-worker"
import { opfsFunctions } from "@/lib/opfs-worker/functions"

/**
 * Browser-based repository service backed by OPFS.
 * Manages the collection of crates stored in the browser's Origin Private File System.
 */
export class BrowserRepositoryService implements IRepositoryService {
    private _events = new Observable<IRepositoryServiceEvents>()
    readonly events: IObservable<IRepositoryServiceEvents> = this._events

    constructor(private worker: FunctionWorker<typeof opfsFunctions>) {}

    async getCratesList(): Promise<StoredCrate[]> {
        const crateIds = await this.worker.execute("getCrates")
        return crateIds.map((crateId) => ({
            crateId,
            name: crateId,
            description: "",
            lastOpenedAt: null
        }))
    }

    async createCrateFromZip(zip: Blob): Promise<void> {
        const crateId = await this.worker.execute("createCrateFromZip", zip)
        this._events.emit("crate-created", crateId)
        this._events.emit("crates-list-changed")
    }

    async deleteCrate(crateId: string): Promise<void> {
        await this.worker.execute("deleteCrateDir", crateId)
        this._events.emit("crate-deleted", crateId)
        this._events.emit("crates-list-changed")
    }

    async getCrateAs(crateId: string, format: "zip" | "eln" | "standalone-json"): Promise<Blob> {
        switch (format) {
            case "zip":
                return await this.worker.execute("createCrateZip", crateId)
            case "eln":
                return await this.worker.execute("createCrateEln", crateId)
            case "standalone-json": {
                const blob = await this.worker.execute(
                    "readFile",
                    crateId,
                    "ro-crate-metadata.json"
                )
                return new Blob([await blob.text()], { type: "application/ld+json" })
            }
        }
    }

    async getStorageQuota(): Promise<IStorageQuota> {
        const info = await this.worker.execute("getStorageInfo")
        return {
            usedSpace: info.usedSpace,
            totalSpace: info.totalSpace,
            persistent: info.persistent
        }
    }
}
