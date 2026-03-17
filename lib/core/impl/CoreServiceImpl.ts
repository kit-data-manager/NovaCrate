import { ICoreService } from "@/lib/core/ICoreService"
import { IContextService } from "@/lib/core/IContextService"
import { IMetadataService } from "@/lib/core/IMetadataService"
import { IPersistenceAdapter } from "@/lib/core/IPersistenceAdapter"
import { ICrateService } from "@/lib/core/persistence/ICrateService"
import { IFileService } from "@/lib/core/persistence/IFileService"
import { MetadataServiceImpl } from "@/lib/core/impl/MetadataServiceImpl"
import { ContextServiceImpl } from "@/lib/core/impl/ContextServiceImpl"
import { isDataEntity } from "@/lib/utils"

/**
 * Orchestrates metadata and context operations, delegating entity mutations
 * to IMetadataService and file operations to IFileService.
 */
export class CoreServiceImpl implements ICoreService {
    readonly metadata: IMetadataService
    readonly context: IContextService

    private fileService: IFileService | null
    private removeFileServiceListener: (() => void) | null = null

    private constructor(
        metadata: IMetadataService,
        context: IContextService,
        crateService: ICrateService
    ) {
        this.metadata = metadata
        this.context = context
        this.fileService = crateService.getFileService()

        this.onFileServiceChanged = this.onFileServiceChanged.bind(this)
        this.removeFileServiceListener = crateService.events.addEventListener(
            "file-service-changed",
            this.onFileServiceChanged
        )
    }

    private onFileServiceChanged(newService: IFileService | null) {
        this.fileService = newService
    }

    async addFileEntity(name: string, path: string, file: File): Promise<void> {
        if (this.fileService) {
            await this.fileService.addFile(path, file)
        }

        const entity: IEntity = {
            "@id": path,
            "@type": "File",
            name: name
        }

        await this.metadata.addEntity(entity)
    }

    async addFolderEntity(name: string, path: string): Promise<void> {
        if (this.fileService) {
            await this.fileService.addFolder(path)
        }

        const normalizedPath = path.endsWith("/") ? path : path + "/"

        const entity: IEntity = {
            "@id": normalizedPath,
            "@type": "Dataset",
            name: name
        }

        await this.metadata.addEntity(entity)
    }

    async changeEntityIdentifier(from: string, to: string): Promise<void> {
        const entities = this.metadata.getEntities()
        const entity = entities.find((e) => e["@id"] === from)

        if (entity && isDataEntity(entity) && this.fileService) {
            await this.fileService.move(from, to)
        }

        await this.metadata.changeEntityIdentifier(from, to)
    }

    async deleteEntity(id: string, deleteData: boolean): Promise<void> {
        if (deleteData && this.fileService) {
            await this.fileService.delete(id)
        }

        await this.metadata.deleteEntity(id)
    }

    getContextService(): IContextService {
        return this.context
    }

    getMetadataService(): IMetadataService {
        return this.metadata
    }

    dispose() {
        if (this.removeFileServiceListener) {
            this.removeFileServiceListener()
            this.removeFileServiceListener = null
        }
    }

    static async newInstance(
        persistenceAdapter: IPersistenceAdapter,
        crateService: ICrateService
    ): Promise<CoreServiceImpl> {
        const metadata = await MetadataServiceImpl.newInstance(persistenceAdapter)
        const context = await ContextServiceImpl.newInstance(persistenceAdapter)
        return new CoreServiceImpl(metadata, context, crateService)
    }
}
