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
    createCrateFromZip(zip: Blob): Promise<void>
    deleteCrate(crateId: string): Promise<void>
    getCrateAs(crateId: string, format: "zip" | "eln" | "standalone-json"): Promise<Blob>
    getStorageQuota(): Promise<IStorageQuota>
}
