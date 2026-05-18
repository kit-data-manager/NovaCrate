import {
    IPersistenceService,
    IPersistenceServiceEvents
} from "@/lib/core/persistence/IPersistenceService"
import { ICrateService } from "@/lib/core/persistence/ICrateService"
import { IRepositoryService } from "@/lib/core/persistence/IRepositoryService"
import { IObservable } from "@/lib/core/IObservable"
import { Observable } from "@/lib/core/impl/Observable"
import { IFrameCrateService } from "@/lib/persistence/iframe/IFrameCrateService"

const IFRAME_CRATE_ID = "iframe-crate"

/**
 * {@link IPersistenceService} implementation for iframe mode.
 *
 * In iframe mode NovaCrate is embedded in a parent page and receives its crate
 * metadata via `postMessage`. There is no multi-crate repository, no OPFS
 * worker, and no file management.
 *
 * The lifecycle is:
 * 1. The parent page sends a `LOAD_CRATE` message.
 * 2. {@link IFrameMessenger} calls {@link loadCrate}, which creates an
 *    in-memory {@link IFrameCrateService} and emits `"crate-service-changed"`.
 * 3. {@link CoreProvider} picks up the event and initialises the core layer.
 * 4. Subsequent saves flow through `setMetadata` on the crate service, which
 *    emits `"metadata-changed"` — the messenger listens for this and forwards
 *    the change to the parent page.
 */
export class IFramePersistenceService implements IPersistenceService {
    private _events = new Observable<IPersistenceServiceEvents>()
    readonly events: IObservable<IPersistenceServiceEvents> = this._events

    private crateId: string | null = null
    private crateService: IFrameCrateService | null = null

    // ── IPersistenceService ──────────────────────────────────────────────

    getCrateId(): string | null {
        return this.crateId
    }

    canSetCrateId(): boolean {
        return false
    }

    setCrateId(_crateId: string | null): void {
        console.warn(
            "IFramePersistenceService.setCrateId() is a no-op. " +
                "In iframe mode the crate is provided by the parent page via LOAD_CRATE."
        )
    }

    getCrateService(): ICrateService | null {
        return this.crateService
    }

    async createCrateServiceFor(_crateId: string): Promise<ICrateService | null> {
        return null
    }

    getRepositoryService(): IRepositoryService | null {
        return null
    }

    async healthCheck(): Promise<void> {
        // No worker to check — always healthy.
    }

    // ── Iframe-specific methods ──────────────────────────────────────────

    /**
     * Creates (or replaces) the in-memory crate service with the given
     * metadata. Called by {@link IFrameMessenger} when the parent page sends a
     * `LOAD_CRATE` message.
     */
    loadCrate(metadata: string): void {
        this.crateService = new IFrameCrateService(metadata)
        this.crateId = IFRAME_CRATE_ID
        this._events.emit("crate-id-changed", this.crateId)
        this._events.emit("crate-service-changed", this.crateService)
    }

    /**
     * Updates the metadata of the currently loaded crate. Called by
     * {@link IFrameMessenger} when the parent page sends an `UPDATE_CRATE`
     * message.
     *
     * The `setMetadata` call on the crate service will emit
     * `"metadata-changed"`, which the {@link PersistenceAdapterImpl} picks up
     * to propagate the change through the core layer.
     */
    async updateCrate(metadata: string): Promise<void> {
        if (!this.crateService) {
            console.warn(
                "IFramePersistenceService.updateCrate() called before loadCrate(). Ignoring."
            )
            return
        }
        await this.crateService.setMetadata(metadata)
    }

    /**
     * Returns the current metadata string, or `null` if no crate is loaded.
     * Used by {@link IFrameMessenger} to respond to `GET_CRATE` messages and
     * to send `CRATE_CHANGED` notifications.
     */
    async getCurrentMetadata(): Promise<string | null> {
        if (!this.crateService) return null
        return await this.crateService.getMetadata()
    }
}
