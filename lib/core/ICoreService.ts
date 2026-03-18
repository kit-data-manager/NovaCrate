import { IContextService } from "@/lib/core/IContextService"
import { IMetadataService } from "@/lib/core/IMetadataService"

/**
 * Top-level orchestrator for all RO-Crate domain operations on the currently
 * open crate. Implementations should depend on {@link ICrateService}, which
 * is provided by the current persistence layer.
 *
 * {@link ICoreService} coordinates between the core layer
 * ({@link IMetadataService}, {@link IContextService}) and the persistence layer ({@link ICrateService}):
 * for example, {@link ICoreService.addFileEntity} uploads the file bytes via
 * the file service *and* registers the corresponding entity in the metadata
 * graph. It is persistence-agnostic — it does not know whether storage is
 * browser OPFS, a remote server, or something else.
 *
 * Exposed to React components via the
 * {@link useCore} hook (provided by {@link CoreProvider}).
 *
 * Child services are accessible through the getter methods:
 * - {@link ICoreService.getMetadataService} for direct entity CRUD
 * - {@link ICoreService.getContextService} for `@context` inspection and mutation
 */
export interface ICoreService {
    /**
     * Upload `file` to `path` inside the crate and create a corresponding
     * data entity with the given `name` in the metadata graph.
     * @param name - Human-readable name for the entity.
     * @param path - Crate-relative path where the file will be stored.
     * @param file - The file bytes to upload.
     */
    addFileEntity(name: string, path: string, file: File): Promise<void>
    /**
     * Create a folder at `path` inside the crate and add a corresponding
     * data entity with the given `name` to the metadata graph.
     * @param name - Human-readable name for the entity.
     * @param path - Crate-relative path of the new folder.
     */
    addFolderEntity(name: string, path: string): Promise<void>
    /**
     * Rename an entity's `@id` from `from` to `to`. If the entity is a data
     * entity backed by a file or folder, the physical path is also moved via
     * {@link IFileService}.
     * @param from - The current `@id` of the entity.
     * @param to - The new `@id` to assign.
     */
    changeEntityIdentifier(from: string, to: string): Promise<void>
    /**
     * Remove an entity from the metadata graph. If `deleteData` is `true` and
     * the entity is a data entity, the corresponding file or folder is also
     * deleted from storage via {@link IFileService}.
     * @param id - The `@id` of the entity to delete.
     * @param deleteData - Whether to also delete the associated file/folder from storage.
     */
    deleteEntity(id: string, deleteData: boolean): Promise<void>
    /** Returns the {@link IContextService} for the currently open crate. */
    getContextService(): IContextService
    /** Returns the {@link IMetadataService} for the currently open crate. */
    getMetadataService(): IMetadataService
}
