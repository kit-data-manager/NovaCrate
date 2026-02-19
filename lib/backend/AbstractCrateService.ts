import { handleSpringError } from "@/lib/spring-error-handling"

export abstract class AbstractCrateService implements CrateService {
    get featureFlags() {
        return makeCrateServiceFeatureFlags()
    }

    abstract getCrateFileURL(crateId: string, filePath: string): Promise<string>

    abstract addCustomContextPair(crateId: string, key: string, value: string): Promise<void>

    abstract createCrate(name: string, description: string): Promise<string>

    createCrateFromFile(file: Blob): Promise<string> {
        if (file.type === "application/json" || file.type === "application/ld+json") {
            return this.createCrateFromMetadataFile(file)
        }
        if (file.type === "application/zip" || file.type === "application/x-zip-compressed") {
            return this.createCrateFromCrateZip(file)
        }
        console.warn(
            "Unsupported file type " +
                file.type +
                ". Only zip archives and JSON metadata files are supported"
        )

        // Fallback to zip
        return this.createCrateFromCrateZip(file)
    }

    abstract createCrateFromCrateZip(zip: Blob): Promise<string>

    abstract createCrateFromMetadataFile(metadataFile: Blob): Promise<string>

    async createCrateFromFiles(
        name: string,
        description: string,
        files: FolderFile[],
        progressCallback?: (current: number, total: number, errors: string[]) => void
    ): Promise<string> {
        const errors: string[] = []
        const id = await this.createCrate(name, description)
        progressCallback?.(0, files.length, errors)

        const nameFromPath = (path: string): string => {
            const parts = path.split("/").filter((p) => p !== "")
            return parts[parts.length - 1]
        }

        // Stable order of import for simplified testing
        files.sort((a, b) =>
            nameFromPath(a.relativePath).localeCompare(nameFromPath(b.relativePath))
        )
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

    abstract duplicateCrate(crateId: string, newName: string): Promise<string>

    abstract createEntity(
        crateId: string,
        entityData: IEntity,
        overwrite?: boolean
    ): Promise<boolean>

    abstract createFileEntity(
        crateId: string,
        entityData: IEntity,
        file: Blob,
        overwrite?: boolean
    ): Promise<boolean>

    abstract deleteCrate(id: string): Promise<boolean>

    abstract deleteEntity(crateId: string, entityData: IEntity): Promise<boolean>

    abstract renameEntity(
        crateId: string,
        entityData: IEntity,
        newEntityId: string
    ): Promise<boolean>

    abstract downloadCrateZip(id: string): Promise<void>

    abstract downloadCrateEln(id: string): Promise<void>

    abstract downloadFile(crateId: string, filePath: string): Promise<void>

    abstract downloadRoCrateMetadataJSON(id: string): Promise<void>

    abstract getCrate(id: string): Promise<ICrate>

    abstract getCrateFilesList(crateId: string): Promise<string[]>

    abstract getCrateFileInfo(crateId: string, filePath: string): Promise<FileInfo>

    abstract getStorageInfo(crateId?: string): Promise<CrateServiceProviderStorageInfo | null>

    abstract getStoredCrateIds(): Promise<string[]>

    abstract healthCheck(): Promise<void>

    abstract removeCustomContextPair(crateId: string, key: string): Promise<void>

    abstract saveRoCrateMetadataJSON(crateId: string, json: string): Promise<void>

    abstract updateEntity(crateId: string, entityData: IEntity): Promise<boolean>
}

export function makeCrateServiceFeatureFlags(
    flags: Partial<CrateServiceFeatureFlags> = {}
): CrateServiceFeatureFlags {
    return {
        fileManagement: true,
        iframeMessaging: false,
        crateSelectionControlledExternally: false,
        ...flags
    }
}
