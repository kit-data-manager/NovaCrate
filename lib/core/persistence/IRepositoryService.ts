import { IStorageQuota } from "@/lib/core/persistence/IStorageQuota"
import { IObservable } from "@/lib/core/IObservable"

export type IRepositoryServiceEvents = {
    /** Emitted when {@link IRepositoryService.getCratesList} changes. */
    "crates-list-changed": () => void
    "crate-created": (crateId: string) => void
    "crate-deleted": (crateId: string) => void
}

/**
 * Represents a crate stored in the crate repository.
 * TODO: Drop this type
 */
export type StoredCrate = {
    crateId: string
    name: string
    description: string
    lastOpenedAt: Date | null
}

/**
 * Manages the collection of all crates stored in the persistence backend.
 *
 * {@link IRepositoryService} is intentionally metadata-agnostic: it stores and
 * retrieves opaque crate directories and raw JSON strings without parsing or
 * understanding RO-Crate structure. All metadata knowledge (templates,
 * validation, entity construction) lives in {@link CrateFactory} and the core layer.
 *
 * Does not have to be implemented by the persistence implementation. In such a case,
 * the persistence implementation should dictate the crate id and provide externalized means
 * to select a crate.
 *
 * Emits events on {@link IRepositoryService.events} when the crate collection
 * changes so that the crate list UI can update reactively.
 */
export interface IRepositoryService {
    readonly events: IObservable<IRepositoryServiceEvents>

    /** Return the list of all crates currently stored in the repository. */
    // TODO replace with simple string array that returns IDs for each crate in the repository,
    // as we want to keep the crate repository metadata-agnostic. UI is responsible for parsing
    // the crate metadata and remembering lastOpened
    getCratesList(): Promise<StoredCrate[]>

    /**
     * Import a crate from a zip archive (standard RO-Crate zip or ELN format).
     * Emits `"crate-created"` and `"crates-list-changed"` via
     * {@link IRepositoryService.events}.
     * @param zip - The zip archive to import.
     * @returns The crate ID assigned to the newly created crate.
     */
    createCrateFromZip(zip: Blob): Promise<string>

    /**
     * Create a crate by writing the given metadata JSON string as the
     * `ro-crate-metadata.json` file. The repository does not parse or
     * validate the string — that is the caller's responsibility (see
     * {@link CrateFactory}). Emits `"crate-created"` and `"crates-list-changed"`
     * via {@link IRepositoryService.events}.
     * @param metadata - Raw JSON string to write as `ro-crate-metadata.json`.
     * @returns The crate ID assigned to the newly created crate.
     */
    createCrateFromMetadata(metadata: string): Promise<string>

    /**
     * Permanently delete a crate and all its files from the repository.
     * Emits `"crate-deleted"` and `"crates-list-changed"` via
     * {@link IRepositoryService.events}.
     * @param crateId - The ID of the crate to delete.
     */
    deleteCrate(crateId: string): Promise<void>

    /**
     * Export a crate as a downloadable archive.
     * @param crateId - The ID of the crate to export.
     * @param format - `"zip"` for a standard RO-Crate zip, `"eln"` for ELN
     *   format, or `"standalone-json"` for the single `ro-crate-metadata.json` file
     * @returns A {@link Blob} containing the exported archive.
     */
    getCrateAs(crateId: string, format: "zip" | "eln" | "standalone-json"): Promise<Blob>

    /** Return the current storage quota and usage for the whole repository. */
    getStorageQuota(): Promise<IStorageQuota>
}
