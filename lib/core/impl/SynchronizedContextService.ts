import { IPersistenceAdapter } from "@/lib/core/IPersistenceAdapter"
import { BaseContextService } from "@/lib/core/impl/BaseContextService"

/**
 * Provides an easy interface into the crate context for id resolution and specification detection.
 * Is synchronized with the persistence layer through a persistence adapter.
 * @example resolve("Organization") -> "https://schema.org/Organization"
 */
export class SynchronizedContextService extends BaseContextService {
    constructor(private persistenceAdapter: IPersistenceAdapter) {
        super()
        this.persistenceAdapter.events.addEventListener("context-changed", this.update)
    }

    async addCustomContextPair(prefix: string, url: string): Promise<void> {
        await super.addCustomContextPair(prefix, url)
        await this.persistenceAdapter.updateMetadataContext(this.getRaw()!)
    }

    async removeCustomContextPair(prefix: string): Promise<void> {
        await super.removeCustomContextPair(prefix)
        await this.persistenceAdapter.updateMetadataContext(this.getRaw()!)
    }

    dispose() {
        this.persistenceAdapter.events.removeEventListener("context-changed", this.update)
    }

    static async newInstanceWithPersistence(persistenceAdapter: IPersistenceAdapter) {
        const instance = new SynchronizedContextService(persistenceAdapter)
        const context = await persistenceAdapter.getMetadataContext()
        await instance.update(context)
        return instance
    }
}
