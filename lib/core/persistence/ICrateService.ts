import { IFileService } from "@/lib/core/persistence/IFileService"
import { IObservable } from "@/lib/core/IObservable"

export type ICrateServiceEvents = {
    /** Fired whenever `ro-crate-metadata.json` is written — either by
     *  `setMetadata()` or by an external change detected in the backend.
     *  The full raw JSON string is passed to listeners. */
    "metadata-changed": (newMetadata: string) => void
    /** Fired when the `IFileService` instance associated with this crate
     *  becomes available or is torn down (e.g. the crate is closed). */
    "file-service-changed": (newService: IFileService | null) => void
}

/**
 * Represents operations on a single RO-Crate. Optionally composes a file service
 * for manipulating files in the crate. The file service may be absent, depending
 * on the persistence layer implementation.
 *
 * Obtained from
 * {@link IPersistenceService.getCrateService} for the currently opened
 * crate, or from {@link IPersistenceService.createCrateServiceFor} for an
 * arbitrary crate (e.g. during duplication or import workflows).
 *
 * Emits `"metadata-changed"` so that {@link IPersistenceAdapter} can propagate
 * external changes (e.g. direct JSON edits) back into the core layer.
 *
 * Emits `"file-service-changed"` when the file service becomes available or
 * is torn down.
 */
export interface ICrateService {
    readonly events: IObservable<ICrateServiceEvents>

    /**
     * Read and return the raw `ro-crate-metadata.json` content as a string.
     * When the file service is available, this method should call file service
     * methods to read the file contents.
     */
    getMetadata(): Promise<string>
    /**
     * Write `metadata` as the new `ro-crate-metadata.json` content.
     * Emits `"metadata-changed"` via {@link ICrateService.events}.
     * When the file service is available, this method should call file service
     * methods to write the file contents.
     * @param metadata - The raw JSON string to persist.
     */
    setMetadata(metadata: string): Promise<void>
    /**
     * Return the {@link IFileService} for this crate, or `null` if not yet
     * ready or intentionally unavailable (the file service is optional).
     * Listen to the `"file-service-changed"` event to
     * be notified when the service becomes available.
     */
    getFileService(): IFileService | null
}
