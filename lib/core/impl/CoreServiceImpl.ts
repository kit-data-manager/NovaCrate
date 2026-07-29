import { ICoreService } from "@/lib/core/ICoreService"
import { IContextService } from "@/lib/core/IContextService"
import { IMetadataService } from "@/lib/core/IMetadataService"
import { IPersistenceAdapter } from "@/lib/core/IPersistenceAdapter"
import { ICrateService } from "@/lib/core/persistence/ICrateService"
import { IFileService } from "@/lib/core/persistence/IFileService"
import { MetadataServiceImpl } from "@/lib/core/impl/MetadataServiceImpl"
import { ContextServiceImpl } from "@/lib/core/impl/ContextServiceImpl"
import { isDataEntity } from "@/lib/utils"
import { DateTime } from "luxon"
import { IProfileService } from "@/lib/core/profiles/IProfileService"
import { ProfileService } from "@/lib/core/profiles/impl/ProfileService"

/**
 * Orchestrates metadata and context operations, delegating entity mutations
 * to IMetadataService and file operations to IFileService.
 * Also bundles the ProfileService.
 */
export class CoreServiceImpl implements ICoreService {
    private readonly metadata: IMetadataService
    private readonly context: IContextService
    private readonly profiles: IProfileService

    private fileService: IFileService | null
    private removeFileServiceChangedListener: (() => void) | null = null

    private constructor(
        metadata: IMetadataService,
        context: IContextService,
        profiles: IProfileService,
        crateService: ICrateService
    ) {
        this.metadata = metadata
        this.context = context
        this.profiles = profiles
        this.fileService = crateService.getFileService()

        this.onFileServiceChanged = this.onFileServiceChanged.bind(this)
        this.removeFileServiceChangedListener = crateService.events.addEventListener(
            "file-service-changed",
            this.onFileServiceChanged
        )
    }

    private onFileServiceChanged(newService: IFileService | null) {
        this.fileService = newService
    }

    async addFileEntity(
        baseEntity: Omit<IEntity, "@id">,
        path: string,
        file: File,
        overwrite?: boolean
    ): Promise<void> {
        if (this.fileService) {
            await this.fileService.addFile(path, file)
        }

        const entity: IEntity = {
            ...(baseEntity as IEntity),
            "@id": path,
            contentSize: file.size.toString(),
            encodingFormat: file.type,
            dateModified: file.lastModified
                ? (DateTime.fromMillis(file.lastModified).toISO() ?? DateTime.now().toISO())
                : DateTime.now().toISO()
        }

        const result = await this.metadata.addEntity(entity, overwrite)
        if (!result)
            throw new Error(
                "Failed to add metadata entity for file, does the entity already exist?"
            )
    }

    async addFolderEntity(
        baseEntity: Omit<IEntity, "@id">,
        path: string,
        overwrite?: boolean
    ): Promise<void> {
        if (this.fileService) {
            await this.fileService.addFolder(path)
        }

        const normalizedPath = path.endsWith("/") ? path : path + "/"

        const entity: IEntity = {
            ...(baseEntity as IEntity),
            "@id": normalizedPath
        }

        const result = await this.metadata.addEntity(entity, overwrite)
        if (!result)
            throw new Error(
                "Failed to add metadata entity for folder, does the entity already exist?"
            )
    }

    async moveEntity(from: string, to: string): Promise<void> {
        const entities = this.metadata.getEntities()
        const entity = entities.find((e) => e["@id"] === from)

        if (this.fileService) {
            if (!entity || isDataEntity(entity)) {
                await this.fileService.move(from, to)
            }
        }

        await this.metadata.changeEntityIdentifier(from, to)
    }

    async deleteEntity(id: string, deleteData: boolean): Promise<void> {
        let deleted = [id]
        if (deleteData && this.fileService) {
            deleted = await this.fileService.delete(id)
        }

        for (const deletedItem of deleted) {
            await this.metadata.deleteEntity(deletedItem)
        }
    }

    getContextService(): IContextService {
        return this.context
    }

    getMetadataService(): IMetadataService {
        return this.metadata
    }

    getProfileService(): IProfileService {
        return this.profiles
    }

    dispose() {
        if (this.removeFileServiceChangedListener) {
            this.removeFileServiceChangedListener()
            this.removeFileServiceChangedListener = null
        }
    }

    static async newInstance(
        persistenceAdapter: IPersistenceAdapter,
        crateService: ICrateService
    ): Promise<CoreServiceImpl> {
        const metadata = await MetadataServiceImpl.newInstance(persistenceAdapter)
        const context = await ContextServiceImpl.newInstance(persistenceAdapter)
        return new CoreServiceImpl(metadata, context, new ProfileService(metadata), crateService)
    }
}
