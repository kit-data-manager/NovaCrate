import { ICrateService } from "@/lib/core/persistence/ICrateService"
import { IObservable } from "@/lib/core/observable"
import { IRepositoryService } from "@/lib/core/persistence/IRepositoryService"

export type IPersistenceServiceEvents = {
    "crate-id-changed": (newId: string | null) => void
    "crate-service-changed": (newService: ICrateService | null) => void
    "repository-service-changed": (newService: IRepositoryService | null) => void
}

export interface IPersistenceService {
    readonly events: IObservable<IPersistenceServiceEvents>

    getCrateId(): string | null
    canSetCrateId(): boolean
    setCrateId(crateId: string | null): void
    getCrateService(): ICrateService | null
    getRepositoryService(): IRepositoryService | null
}
