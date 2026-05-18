import { ICrateService, ICrateServiceEvents } from "@/lib/core/persistence/ICrateService"
import { IFileService } from "@/lib/core/persistence/IFileService"
import { IObservable } from "@/lib/core/IObservable"
import { Observable } from "@/lib/core/impl/Observable"

/**
 * In-memory {@link ICrateService} used in iframe mode.
 *
 * Stores the RO-Crate metadata JSON string in memory instead of persisting it
 * to OPFS. File management is not supported — {@link getFileService} always
 * returns `null`.
 *
 * When {@link setMetadata} is called (e.g. after the user saves, or when the
 * parent page sends an `UPDATE_CRATE` message), the new metadata is stored and
 * a `"metadata-changed"` event is emitted so that the {@link PersistenceAdapterImpl}
 * can propagate the change to the core layer.
 */
export class IFrameCrateService implements ICrateService {
    private _events = new Observable<ICrateServiceEvents>()
    readonly events: IObservable<ICrateServiceEvents> = this._events

    private metadata: string

    constructor(initialMetadata: string) {
        this.metadata = initialMetadata
    }

    async getMetadata(): Promise<string> {
        return this.metadata
    }

    async setMetadata(metadata: string): Promise<void> {
        this.metadata = metadata
        this._events.emit("metadata-changed", metadata)
    }

    getFileService(): IFileService | null {
        return null
    }
}
