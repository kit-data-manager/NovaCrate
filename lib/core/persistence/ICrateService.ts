import { IFileService } from "@/lib/core/persistence/IFileService"
import { IObservable } from "@/lib/core/observable"

export type ICrateServiceEvents = {
    "metadata-changed": (newMetadata: string) => void
    "file-service-changed": (newService: IFileService | null) => void
}

export interface ICrateService {
    readonly events: IObservable<ICrateServiceEvents>

    getMetadata(): Promise<string>
    setMetadata(metadata: string): Promise<void>
    getFileService(): IFileService | null
}
