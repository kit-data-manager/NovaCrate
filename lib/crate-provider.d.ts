/**
 * The Crate Service Provider is in charge of delivering crate data and performing manipulations
 * of the crate data in response to UI events
 *
 * For file previews, either getCrateFileWithData or getCrateFileURL must be implemented
 *
 * Optional functions can be omitted, but will reduce the feature set of the UI
 *
 * @draft
 */
declare interface CrateServiceProvider {
    /**
     * Create an empty crate with no files except ro-crate-metadata.json
     * @param name Name of the crate
     * @param description Description of the crate
     * @returns Promise - resolves on success with the crate id
     */
    createCrate(name: string, description: string): Promise<string>

    /**
     * Upload a valid crate in form of a zip archive
     * @param zip zip archive of a valid crate
     * @returns Promise - resolves on success with the id if the new crate
     * @throws Error when the ID is already in use or when an error occurred
     */
    createCrateFromCrateZip(zip: File): Promise<string>

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
        files: File[],
        progressCallback?: (current: number, total: number, errors: string[]) => void
    ): Promise<string>

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
     * Return the metadata of an entity
     * @param crateId ID of the target crate
     * @param entityId ID of the target entity
     * @throws Error when no entity is found
     * @returns Promise - resolves on success
     */
    getEntity(crateId: string, entityId: string): Promise<IFlatEntity>

    /**
     * Update the data of an entity. Can't be used to update the @id property
     * @param crateId ID of the target crate
     * @param entityData Changed data of the entity. Unchanged keys can be omitted. @id must be present. Keys that must be removed will be set to null
     * @returns Promise - resolves on success
     */
    updateEntity(crateId: string, entityData: IFlatEntity): Promise<boolean>

    /**
     * Add a new entity to the crate. Should fail when an entity with the given ID already
     * exists
     * @param crateId ID of the target crate
     * @param entityData Data of the new entity
     * @returns Promise - resolves on success
     */
    createEntity(crateId: string, entityData: IFlatEntity): Promise<boolean>

    createFileEntity(crateId: string, entityData: IFlatEntity, file: File): Promise<boolean>

    /**
     * Remove an entity from the crate and also remove all references
     * @param crateId ID of the target crate
     * @param entityData Data of the entity that should be deleted. Relevant are only @id and @type
     * @returns Promise - resolves on success
     */
    deleteEntity(crateId: string, entityData: IFlatEntity): Promise<boolean>

    /**
     * Rename an entity (change the @id) and also rename all references
     * @param crateId ID of the target crate
     * @param oldEntityId Current (old) ID of the entity
     * @param newEntityId New ID of the entity
     * @returns Promise - resolves on success
     */
    renameEntity?: (crateId: string, oldEntityId: string, newEntityId: string) => Promise<boolean>

    /**
     * Get a complete list of files in the crate archive, excluding ro-crate-metadata.json,
     * ro-crate-preview.html and related files
     * @param crateId ID of the target crate
     * @returns Promise - resolves on success
     */
    getCrateFilesList(crateId: string): Promise<ICrateFile[]>

    /**
     * Get a list of files in the crate archive that are not describe by a data entity, excluding ro-crate-metadata.json,
     * ro-crate-preview.html and related files
     * @param crateId ID of the target crate
     * @returns Promise - resolves on success
     */
    getCrateUndeclaredFilesList(crateId: string): Promise<ICrateFile[]>

    /**
     * Get a file in the crate archive, including its data
     * @param crateId ID of the target crate
     * @param filePath Path to the desired file, including file name and extension
     */
    getCrateFileWithData?: (crateId: string, filePath: string) => Promise<ICrateFileWithData>

    /**
     * Get a URL to a file from the crate archive, for preview or download purposes
     * @param crateId ID of the target crate
     * @param filePath Path to the desired file, including file name and extension
     */
    getCrateFileURL?: (crateId: string, filePath: string) => Promise<string>

    /**
     * Upload a file to the service and add it to the crate archive
     * @param crateId ID of the target crate
     * @param file file to upload
     * @returns Promise - resolves on success
     */
    uploadCrateFileWithData?: (crateId: string, file: ICrateFileWithData) => boolean

    /**
     * Upload a zip archive of files to the service and unzip the files into the crate archive
     * @param crateId ID of the target crate
     * @param zip zip buffer to upload and unpack
     * @returns true on success
     */
    uploadCrateFileZip?: (crateId: string, zip: File) => boolean

    /**
     * Get the crate archive. This function should initiate a download or save dialog (or similar)
     * @param id ID of the target crate
     * @returns void - This function should not return anything
     */
    downloadCrateZip(id: string): void

    /**
     * Get the `ro-crate-metadata.json`. This function should initiate a download or save dialog (or similar)
     * @param id ID of the target crate
     * @returns void - This function should not return anything
     */
    downloadRoCrateMetadataJSON(id: string): void
}
