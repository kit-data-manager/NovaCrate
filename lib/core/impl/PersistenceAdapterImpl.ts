import { IPersistenceAdapter, IPersistenceAdapterEvents } from "@/lib/core/IPersistenceAdapter"
import { ICrateService } from "@/lib/core/persistence/ICrateService"
import { Observable } from "@/lib/core/impl/Observable"
import { IObservable } from "@/lib/core/IObservable"

/**
 * Bridges the persistence layer (ICrateService) and the core services
 * (IMetadataService, IContextService) by converting between raw JSON
 * metadata strings and typed crate graph/context objects.
 */
export class PersistenceAdapterImpl implements IPersistenceAdapter {
    private _events = new Observable<IPersistenceAdapterEvents>()
    readonly events: IObservable<IPersistenceAdapterEvents> = this._events

    private removeMetadataListener: (() => void) | null = null

    constructor(private crateService: ICrateService) {
        this.onMetadataChanged = this.onMetadataChanged.bind(this)
        this.removeMetadataListener = crateService.events.addEventListener(
            "metadata-changed",
            this.onMetadataChanged
        )
    }

    async getMetadataGraph(): Promise<ICrate["@graph"]> {
        const raw = await this.crateService.getMetadata()
        const crate = PersistenceAdapterImpl.parse(raw)
        return crate["@graph"]
    }

    async getMetadataContext(): Promise<ICrate["@context"]> {
        const raw = await this.crateService.getMetadata()
        const crate = PersistenceAdapterImpl.parse(raw)
        return crate["@context"]
    }

    async updateMetadataGraph(metadata: ICrate["@graph"]): Promise<void> {
        const raw = await this.crateService.getMetadata()
        const crate = PersistenceAdapterImpl.parse(raw)
        crate["@graph"] = metadata
        await this.crateService.setMetadata(JSON.stringify(crate, null, 2))
    }

    async updateMetadataContext(context: ICrate["@context"]): Promise<void> {
        const raw = await this.crateService.getMetadata()
        const crate = PersistenceAdapterImpl.parse(raw)
        crate["@context"] = context
        await this.crateService.setMetadata(JSON.stringify(crate, null, 2))
    }

    private async onMetadataChanged(newMetadata: string) {
        const crate = PersistenceAdapterImpl.parse(newMetadata)
        this._events.emit("graph-changed", crate["@graph"])
        this._events.emit("context-changed", crate["@context"])
    }

    dispose() {
        if (this.removeMetadataListener) {
            this.removeMetadataListener()
            this.removeMetadataListener = null
        }
    }

    private static parse(raw: string): ICrate {
        const parsed = JSON.parse(raw)
        if (!parsed || typeof parsed !== "object") {
            throw new Error("Invalid crate metadata: expected a JSON object")
        }
        if (!("@graph" in parsed) || !Array.isArray(parsed["@graph"])) {
            throw new Error('Invalid crate metadata: missing or malformed "@graph"')
        }
        if (!("@context" in parsed)) {
            throw new Error('Invalid crate metadata: missing "@context"')
        }
        return parsed as ICrate
    }
}
