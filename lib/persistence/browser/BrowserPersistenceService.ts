import {
    IPersistenceService,
    IPersistenceServiceEvents
} from "@/lib/core/persistence/IPersistenceService"
import { ICrateService } from "@/lib/core/persistence/ICrateService"
import { IRepositoryService } from "@/lib/core/persistence/IRepositoryService"
import { IObservable } from "@/lib/core/IObservable"
import { Observable } from "@/lib/core/impl/Observable"
import { FunctionWorker } from "@/lib/function-worker"
import { opfsFunctions } from "@/lib/opfs-worker/functions"
import { BrowserCrateService } from "@/lib/persistence/browser/BrowserCrateService"
import { BrowserRepositoryService } from "@/lib/persistence/browser/BrowserRepositoryService"
import { addBasePath } from "next/dist/client/add-base-path"

/**
 * Browser-based persistence service backed by OPFS.
 * Top-level service that manages the OPFS worker, the current crate ID,
 * and the lifecycle of crate and repository services.
 *
 * Invariant: getCrateId() == null implies getCrateService() == null
 */
export class BrowserPersistenceService implements IPersistenceService {
    private _events = new Observable<IPersistenceServiceEvents>()
    readonly events: IObservable<IPersistenceServiceEvents> = this._events

    private worker: FunctionWorker<typeof opfsFunctions>
    private crateId: string | null = null
    private crateService: BrowserCrateService | null = null
    private repositoryService: BrowserRepositoryService

    constructor() {
        this.worker = new FunctionWorker(opfsFunctions)
        this.worker.mount(addBasePath("/opfs-worker.js"))
        this.repositoryService = new BrowserRepositoryService(this.worker)
    }

    getCrateId(): string | null {
        return this.crateId
    }

    canSetCrateId(): boolean {
        return true
    }

    setCrateId(crateId: string | null): void {
        if (this.crateId === crateId) return

        this.crateId = crateId
        this._events.emit("crate-id-changed", crateId)

        if (crateId !== null) {
            this.crateService = new BrowserCrateService(crateId, this.worker)
        } else {
            this.crateService = null
        }

        this._events.emit("crate-service-changed", this.crateService)
    }

    getCrateService(): ICrateService | null {
        return this.crateService
    }

    async createCrateServiceFor(crateId: string): Promise<ICrateService | null> {
        return new BrowserCrateService(crateId, this.worker)
    }

    getRepositoryService(): IRepositoryService | null {
        return this.repositoryService
    }

    async healthCheck(): Promise<void> {
        const healthy = await this.worker.healthTest()
        if (!healthy) {
            throw new Error("OPFS worker not healthy")
        }
    }
}
