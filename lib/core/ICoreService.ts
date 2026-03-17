import { IContextService } from "@/lib/core/IContextService"
import { IMetadataService } from "@/lib/core/IMetadataService"

export interface ICoreService {
    readonly metadata: IMetadataService
    readonly context: IContextService

    addFileEntity(name: string, path: string, file: File): Promise<void>
    addFolderEntity(name: string, path: string): Promise<void>
    changeEntityIdentifier(from: string, to: string): Promise<void>
    deleteEntity(id: string, deleteData: boolean): Promise<void>
    getContextService(): IContextService
    getMetadataService(): IMetadataService
}
