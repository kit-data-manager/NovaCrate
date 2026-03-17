import { IStorageQuota } from "@/lib/core/persistence/IStorageQuota"
import { IObservable } from "@/lib/core/IObservable"

export type IRepositoryServiceEvents = {
    "crates-list-changed": () => void
    "crate-created": (crateId: string) => void
    "crate-deleted": (crateId: string) => void
}

export type StoredCrate = {
    crateId: string
    name: string
    description: string
    lastOpenedAt: Date | null
}

export interface IRepositoryService {
    readonly events: IObservable<IRepositoryServiceEvents>

    getCratesList(): Promise<StoredCrate[]>

    /**
     * Import a crate from a zip archive (standard RO-Crate zip or ELN format).
     * @returns The crate ID assigned to the newly created crate.
     */
    createCrateFromZip(zip: Blob): Promise<string>

    /**
     * Create a crate by writing the given metadata JSON string as the
     * {@code ro-crate-metadata.json} file. The repository does not parse or
     * validate the string — that is the caller's responsibility.
     * @returns The crate ID assigned to the newly created crate.
     */
    createCrateFromMetadata(metadata: string): Promise<string>

    deleteCrate(crateId: string): Promise<void>
    getCrateAs(crateId: string, format: "zip" | "eln" | "standalone-json"): Promise<Blob>
    getStorageQuota(): Promise<IStorageQuota>
}
