import {
    IPersistenceService,
    IPersistenceServiceEvents
} from "@/lib/core/persistence/IPersistenceService"
import { ICrateService } from "@/lib/core/persistence/ICrateService"
import { IRepositoryService } from "@/lib/core/persistence/IRepositoryService"
import { IObservable } from "@/lib/core/IObservable"
import { Observable } from "@/lib/core/impl/Observable"
import { DesktopCrateService } from "@/lib/persistence/desktop/DesktopCrateService"
import { DesktopRepositoryService } from "@/lib/persistence/desktop/DesktopRepositoryService"
import { invokeCommand } from "@/lib/persistence/desktop/tauri"

/**
 * Desktop persistence service backed by the native Rust backend
 * (`novacrate-desktop`, built with Tauri).
 *
 * There is no central crate storage: the crate ID *is* the path of a local
 * crate zip file. While a crate is open, the backend extracts it into a
 * temporary working directory and writes the working copy back into the
 * original zip file on every save.
 *
 * Invariant: getCrateId() == null implies getCrateService() == null
 */
export class DesktopPersistenceService implements IPersistenceService {
    private _events = new Observable<IPersistenceServiceEvents>()
    readonly events: IObservable<IPersistenceServiceEvents> = this._events

    private crateId: string | null = null
    private crateService: DesktopCrateService | null = null
    private repositoryService: DesktopRepositoryService

    constructor() {
        this.repositoryService = new DesktopRepositoryService()
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

        const previousCrateService = this.crateService

        if (previousCrateService) {
            previousCrateService.dispose()
        }

        if (crateId !== null) {
            this.repositoryService.addRecent(crateId)
            this.crateService = new DesktopCrateService(crateId)
            this.crateService.ready.catch((e) =>
                console.error(`Failed to open crate ${crateId}`, e)
            )
        } else {
            this.crateService = null
        }

        this._events.emit("crate-service-changed", this.crateService)
    }

    getCrateService(): ICrateService | null {
        return this.crateService
    }

    async createCrateServiceFor(crateId: string): Promise<ICrateService | null> {
        const exists = await invokeCommand<boolean>("crate_exists", { crateId })
        if (!exists) {
            return null
        }
        return new DesktopCrateService(crateId)
    }

    getRepositoryService(): IRepositoryService | null {
        return this.repositoryService
    }

    async healthCheck(): Promise<void> {
        const response = await invokeCommand<string>("ping")
        if (response !== "pong") {
            throw new Error("Desktop backend not healthy")
        }
    }

    dispose(): void {
        if (this.crateService) {
            this.crateService.dispose()
        }
    }
}
