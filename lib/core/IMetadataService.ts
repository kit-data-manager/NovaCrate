import { IObservable } from "@/lib/core/IObservable"

export type IMetadataServiceEvents = {
    /** Fired after any mutation that results in a changed `@graph`.
     *  The full updated entity array is passed to listeners. */
    "graph-changed": (newGraph: IEntity[]) => void
}

/**
 * Manages the `@graph` of the currently open RO-Crate — the in-memory
 * collection of all entities (metadata descriptor, root data entity, and
 * all contextual / data entities).
 *
 * Implemented by `MetadataServiceImpl`. Consumed by {@link ICoreService}, which
 * wraps higher-level operations (file/folder entities, identifier renames)
 * on top of this lower-level CRUD interface.
 *
 * Emits `"graph-changed"` on every successful mutation. Subscribe via
 * {@link IMetadataService.events}.
 */
export interface IMetadataService {
    readonly events: IObservable<IMetadataServiceEvents>

    /** Returns a snapshot of all entities in the current `@graph`. */
    getEntities(): IEntity[]
    /**
     * Add a new entity to the graph. If an entity with the same `@id` already
     * exists, the call is a no-op unless `overwrite` is `true`.
     * @param entity - The entity to add.
     * @param overwrite - If `true`, replace any existing entity with the same `@id`.
     * @returns `true` if the entity was written, `false` if it was skipped.
     */
    addEntity(entity: IEntity, overwrite?: boolean): Promise<boolean>
    /**
     * Replace an existing entity in the graph (matched by `@id`).
     * @param entity - The updated entity; must already exist in the graph.
     */
    updateEntity(entity: IEntity): Promise<void>
    /**
     * Rename an entity's `@id` from `from` to `to`, updating all inbound
     * {@link IReference} values across the entire graph to point at the new ID.
     * To reliably rename an entity including referenced files, call {@link ICoreService.changeEntityIdentifier}
     * @param from - The current `@id` of the entity.
     * @param to - The new `@id` to assign.
     */
    changeEntityIdentifier(from: string, to: string): Promise<void>
    /**
     * Remove an entity from the graph by `@id`. Also removes it from the
     * root entity's `hasPart` list if present.
     * To also delete the corresponding data, instead call {@link ICoreService.deleteEntity}
     * @param id - The `@id` of the entity to delete.
     */
    deleteEntity(id: string): Promise<void>
}
