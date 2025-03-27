import { handleSpringError } from "@/lib/spring-error-handling"

export abstract class CrateServiceBase implements CrateServiceAdapter {
    abstract getCrateFileURL(crateId: string, filePath: string): Promise<string>

    abstract addCustomContextPair(crateId: string, key: string, value: string): Promise<void>

    abstract createCrate(name: string, description: string): Promise<string>

    abstract createCrateFromCrateZip(zip: Blob): Promise<string>

    async createCrateFromFiles(
        name: string,
        description: string,
        files: FolderFile[],
        progressCallback?: (current: number, total: number, errors: string[]) => void
    ): Promise<string> {
        const errors: string[] = []
        const id = await this.createCrate(name, description)
        progressCallback?.(0, files.length, errors)

        for (const file of files) {
            const pathSplit = file.relativePath.split("/")
            if (pathSplit.length > 1) pathSplit[0] = "."
            try {
                await this.createFileEntity(
                    id,
                    {
                        "@id": pathSplit.join("/").slice(2),
                        "@type": "File",
                        name: pathSplit[pathSplit.length - 1]
                    },
                    file.data
                )
            } catch (e) {
                console.error(e)
                errors.push(handleSpringError(e))
            }

            progressCallback?.(files.indexOf(file) + 1, files.length, errors)
        }

        return id
    }

    abstract createEntity(crateId: string, entityData: IEntity): Promise<boolean>

    abstract createFileEntity(crateId: string, entityData: IEntity, file: Blob): Promise<boolean>

    abstract deleteCrate(id: string): Promise<boolean>

    abstract deleteEntity(crateId: string, entityData: IEntity): Promise<boolean>

    abstract downloadCrateZip(id: string): Promise<void>

    abstract downloadFile(crateId: string, filePath: string): Promise<void>

    abstract downloadRoCrateMetadataJSON(id: string): Promise<void>

    abstract getCrate(id: string): Promise<ICrate>

    abstract getCrateFilesList(crateId: string): Promise<string[]>

    abstract getStorageInfo(crateId?: string): Promise<CrateServiceProviderStorageInfo | null>

    abstract getStoredCrateIds(): Promise<string[]>

    abstract healthCheck(): Promise<void>

    abstract importEntityFromOrcid(crateId: string, url: string): Promise<string>

    abstract importOrganizationFromRor(crateId: string, url: string): Promise<string>

    abstract removeCustomContextPair(crateId: string, key: string): Promise<void>

    abstract saveRoCrateMetadataJSON(crateId: string, json: string): Promise<void>

    abstract updateEntity(crateId: string, entityData: IEntity): Promise<boolean>
}
