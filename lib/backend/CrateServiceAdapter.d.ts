/**
 * The Crate Service Adapter is in charge of delivering crate data and performing manipulations
 * of the crate data in response to UI events
 *
 * For file previews, either getCrateFileWithData or getCrateFileURL must be implemented
 *
 * Optional functions can be omitted, but will reduce the feature set of the UI
 */
declare interface CrateServiceAdapter {
    /**
     * Create an empty crate with no files except ro-crate-metadata.json
     * @param name Name of the crate
     * @param description Description of the crate
     * @returns Promise - resolves on success with the crate id
     */
    createCrate(name: string, description: string): Promise<string>

    /**
     * Create a crate from a file representing a crate
     * @param file representing a valid crate in some way, could be a zip archive or a json file
     * @returns Promise - resolves on success with the id if the new crate
     * @throws Error when the ID is already in use or when an error occurred
     */
    createCrateFromFile(file: Blob): Promise<string>

    /**
     * Upload a valid crate in form of a zip archive
     * @param zip zip archive of a valid crate
     * @returns Promise - resolves on success with the id if the new crate
     * @throws Error when the ID is already in use or when an error occurred
     */
    createCrateFromCrateZip(zip: Blob): Promise<string>

    /**
     * Create a crate from a valid JSON metadata file
     * @param metadataFile Blob containing the metadata file as application/json context
     * @returns Promise - resolves on success with the id if the new crate
     * @throws Error when the ID is already in use or when an error occurred
     */
    createCrateFromMetadataFile(metadataFile: Blob): Promise<string>

    /**
     * Create a new crate with a folder of files. The folder is not required to already
     * be a valid crate, thus ro-crate-metadata.json and related files could be missing
     * @param name name of the crate
     * @param description description of the crate
     * @param files files for the new crate
     * @param progressCallback Callback that will be called with the current upload progress
     * @returns Promise - resolves with the crate id on success
     * @throws Error when the ID is already in use or when an error occurred
     */
    createCrateFromFiles(
        name: string,
        description: string,
        files: FolderFile[],
        progressCallback?: (current: number, total: number, errors: string[]) => void
    ): Promise<string>

    /**
     * Duplicate an existing crate. The new crate will have a new ID and will contain a copy of all files and metadata.
     * @param crateId ID of the existing crate to duplicate
     * @param newName New name for the duplicated crate
     */
    duplicateCrate(crateId: string, newName: string): Promise<string>

    /**
     * Return the entire ro-crate-metadata.json fully flattened as a JavaScript object
     * @param id ID of the target crate
     * @returns Promise - resolves on success
     */
    getCrate(id: string): Promise<ICrate>

    /**
     * Get a list of all ids of all crates stored in the provider
     */
    getStoredCrateIds(): Promise<string[]>

    /**
     * Delete the specified crate including its archive
     * @param id ID of the target crate
     * @returns Promise - resolves on success
     */
    deleteCrate(id: string): Promise<boolean>

    /**
     * Update the data of an entity. Can't be used to update the @id property
     * @param crateId ID of the target crate
     * @param entityData Changed data of the entity. Unchanged keys can be omitted. @id must be present. Keys that must be removed will be set to null
     * @returns Promise - resolves on success
     */
    updateEntity(crateId: string, entityData: IEntity): Promise<boolean>

    /**
     * Add a new entity to the crate. Should fail when an entity with the given ID already
     * exists
     * @param crateId ID of the target crate
     * @param entityData Data of the new entity
     * @param overwrite Set to true to override existing entity with the same identifier
     * @returns Promise - resolves on success
     */
    createEntity(crateId: string, entityData: IEntity, overwrite?: boolean): Promise<boolean>

    createFileEntity(
        crateId: string,
        entityData: IEntity,
        file: File,
        overwrite?: boolean
    ): Promise<boolean>

    /**
     * Remove an entity from the crate and also remove all references. If this is a data entity, it will also remove
     * the data from the crate
     * @param crateId ID of the target crate
     * @param entityData Data of the entity that should be deleted. Relevant are only @id and @type
     * @returns Promise - resolves on success
     */
    deleteEntity(crateId: string, entityData: IEntity): Promise<boolean>

    renameEntity(crateId: string, entityData: IEntity, newEntityId: string): Promise<boolean>

    /**
     * Get a complete list of file names in the crate archive
     * @param crateId ID of the target crate
     * @returns Promise - resolves on success
     */
    getCrateFilesList(crateId: string): Promise<string[]>

    /**
     * Get information about a file or directory inside a crate.
     * Implementations MUST throw if the path does not exist or cannot be accessed.
     * @param crateId Identifier of the crate
     * @param filePath Path relative to the crate root
     * @returns FileInfo describing type/name of the item
     * @throws Error when the filePath is invalid or inaccessible
     */
    getCrateFileInfo(crateId: string, filePath: string): Promise<FileInfo>

    /**
     * Get a URL to a file from the crate archive, for preview or download purposes
     * @param crateId ID of the target crate
     * @param filePath Path to the desired file, including file name and extension
     */
    getCrateFileURL?: (crateId: string, filePath: string) => Promise<string>

    /**
     * Get the crate archive. This function should initiate a download or save dialog (or similar)
     * @param id ID of the target crate
     * @returns Promise<void> - Resolves on success
     */
    downloadCrateZip(id: string): Promise<void>

    /**
     * Get the crate archive in the ELN format. This function should initiate a download or save dialog (or similar)
     * @param id ID of the target crate
     * @returns Promise<void> - Resolves on success
     */
    downloadCrateEln(id: string): Promise<void>

    /**
     * Get the `ro-crate-metadata.json`. This function should initiate a download or save dialog (or similar)
     * @param id ID of the target crate
     * @returns Promise<void> - Resolves on success
     */
    downloadRoCrateMetadataJSON(id: string): Promise<void>

    saveRoCrateMetadataJSON(crateId: string, json: string): Promise<void>

    /**
     * Download any file from the crate. This function should initiate a download or save dialog (or similar)
     * @param crateId ID of the target crate
     * @param filePath Path to the file in the archive
     * @returns Promise<void> - Resolves on success
     */
    downloadFile(crateId: string, filePath: string): Promise<void>

    addCustomContextPair(crateId: string, key: string, value: string): Promise<void>

    removeCustomContextPair(crateId: string, key: string): Promise<void>

    /**
     * Check if the provider is healthy. Throw if not, resolve if yes
     */
    healthCheck(): Promise<void>

    /**
     * Get storage information in general or per crate. If not applicable, should return null.
     * If storage information is not applicable per crate, but is in general, simply ignore the crateId.
     * @param crateId
     */
    getStorageInfo(crateId?: string): Promise<CrateServiceProviderStorageInfo | null>
}

declare interface CrateServiceProviderStorageInfo {
    usedSpace: number
    totalSpace: number
    persistent: boolean
}

/**
 * This interface is used for carrying extended file information when uploading a folder.
 * The File interface is not used to allow arbitrary folder uploads
 */
declare interface FolderFile {
    /**
     * Relative path of the file to the folder that was selected for upload
     */
    relativePath: string
    data: Blob
}

declare interface FileInfo {
    type: "file" | "directory"
    name: string
}
