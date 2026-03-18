import { ICrateService } from "@/lib/core/persistence/ICrateService"
import { IObservable } from "@/lib/core/IObservable"
import { IRepositoryService } from "@/lib/core/persistence/IRepositoryService"

export type IPersistenceServiceEvents = {
    "crate-id-changed": (newId: string | null) => void
    "crate-service-changed": (newService: ICrateService | null) => void
    "repository-service-changed": (newService: IRepositoryService | null) => void
}

/**
 * Top-level entry point for the persistence layer. Manages which crate is
 * currently open and provides access to the {@link ICrateService} for that
 * crate and the {@link IRepositoryService} for the whole crate collection.
 *
 * There is a single {@link IPersistenceService} instance for the lifetime of
 * the editor session and provided to
 * React components via `PersistenceProvider` / `usePersistence()`.
 *
 * Opening a crate is done by calling {@link IPersistenceService.setCrateId}
 * with a valid crate ID. This causes a new {@link ICrateService} to be
 * instantiated and emitted via `"crate-service-changed"`. Setting the ID to
 * `null` closes the current crate. The persistence service can choose to forbid
 * setting the crate ID and control it internally. This results in the main menu
 * of the editor being deactivated and relying on the persistence implementation
 * to dictate the currently opened crate.
 *
 * {@link IPersistenceService.createCrateServiceFor} creates a standalone
 * {@link ICrateService} for an arbitrary crate ID without changing the
 * currently open crate — useful for import/duplication workflows in
 * `CrateFactory`.
 */
export interface IPersistenceService {
    readonly events: IObservable<IPersistenceServiceEvents>

    /** Return the ID of the currently open crate, or `null` if no crate is open. */
    getCrateId(): string | null
    /**
     * Return `true` if the backend allows receiving {@link setCrateId} calls.
     * Return `false` to prevent the editor and the user from selecting which crate to open.
     */
    canSetCrateId(): boolean
    /**
     * Open the crate with `crateId`, or close the current crate when `null`.
     * Emits `"crate-id-changed"` and `"crate-service-changed"` via
     * {@link IPersistenceService.events}.
     * @param crateId - ID of the crate to open, or `null` to close.
     */
    setCrateId(crateId: string | null): void
    /**
     * Return the {@link ICrateService} for the currently open crate, or
     * `null` if no crate is open.
     */
    getCrateService(): ICrateService | null
    /**
     * Create and return a standalone {@link ICrateService} for the given
     * `crateId` without changing the currently selected crate. Returns `null`
     * if the backend is not ready or the crate does not exist.
     * @param crateId - ID of the crate to open a service for.
     */
    createCrateServiceFor(crateId: string): Promise<ICrateService | null>
    /**
     * Return the {@link IRepositoryService}, or `null` if the backend has
     * not yet initialised or no repository service is provided.
     */
    getRepositoryService(): IRepositoryService | null
}
