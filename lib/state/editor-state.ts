import { immer } from "zustand/middleware/immer"
import { Draft, enableMapSet } from "immer"
import { AutoReference, Diff, getRootEntityID, isEntityEqual } from "@/lib/utils"
import { CrateContext } from "@/lib/crate-context"
import { createWithEqualityFn } from "zustand/traditional"
import { useStore } from "zustand"
import { getPropertyTypeDefaultValue, PropertyType } from "@/lib/property"
import { unstable_ssrSafe as ssrSafe } from "zustand/middleware"

enableMapSet()

/**
 * This is the central state of the editor, holding a working copy of the crate state as well as some additional state.
 * The editor state works on a best-effort basis and will optimistically handle unexpected state changes.
 * Most methods return void, indicating that the state change will always succeed.
 */
export interface EditorState {
    /**
     * Corresponds to the current remote crate context, used to determine changes in the local context
     */
    initialCrateContext: CrateContext
    /**
     * Current local crate context
     */
    crateContext: CrateContext
    /**
     * Whether the crate context is ready to be used
     */
    crateContextReady: boolean

    /**
     * Updates the initial crate context. Called by the {@link CrateDataProvider} whenever the remote context changes
     */
    updateInitialCrateContext(crateContext: CrateContextType): void

    /**
     * Update the local crate context
     */
    updateCrateContext(crateContext: CrateContextType): void

    /**
     * Corresponds to the current remote crate state, used to determine changes in the local state
     */
    initialEntities: Map<string, IEntity>
    /**
     * Current local crate state. Map of entity ids to entities.
     */
    entities: Map<string, IEntity>

    /**
     * Updates the initial crate state. Called by the {@link CrateDataProvider} whenever the remote state changes
     */
    setInitialEntities(data: Map<string, IEntity>): void
    /**
     * Updates the editor crate state. Called by the {@link CrateDataProvider} when conflicts between local and remote state are being resolved.
     */
    setEntities(data: Map<string, IEntity>): void

    /**
     * Returns the current entities as a map of entity ids to entities. Utility for getting the entities field
     */
    getEntities(): Map<string, IEntity>

    /**
     * Get a map of entity ids to their change status compared to the remote crate state. Can either be changed (different to backend), unchanged, or new (not created in backend).
     */
    getEntitiesChangelist(): Map<string, Diff>

    /**
     * Get the change status of a single entity compared to the remote crate state. Can either be null, changed (different to backend), unchanged, or new (not created in backend). Returns null if the entity does not exist in the remote crate state.
     * @param id
     */
    getEntityDiff(id: string): Diff | null

    /**
     * Find the root entity id as outlined in the ro-crate specification. Returns undefined if no root entity is found.
     */
    getRootEntityId(): string | undefined

    /**
     * Get a list of all entities whose change status is not None.
     */
    getChangedEntities(): IEntity[]

    /**
     * Returns true if there are entities whose change status is not None.
     */
    getHasUnsavedChanges(): boolean

    /**
     * Create an entity with the given @id and @type. May also include additional properties, as well as the option to automatically reference the newly created entity from another entity.
     * @param entityId The id of the new entity to create
     * @param types The type(s) of the new entity
     * @param properties Optional. Additional properties that will be added to the entity.
     * @param autoReference An AutoReference object that allows creating a reference to the newly created entity in the entity described by the AutoReference. This is used when creating a new entity in an empty reference field. This way, the reference will be added directly after the new entity is created, and also after the id of the entity has been sanitized and formatted.
     * @returns Returns the newly created entity, or undefined if an entity with the same id already exists.
     */
    addEntity(
        entityId: string,
        types: string[],
        properties?: Record<string, EntityPropertyTypes>,
        autoReference?: AutoReference
    ): IEntity | undefined

    /**
     * Add a property of the given name to the given entity. The type or value of the property can optionally be specified.
     * @param entityId Id of the entity where the property should be added.
     * @param propertyName Name of the property to add.
     * @param value Value of the property or type of the property to add. Optional but recommended.
     */
    addProperty(entityId: string, propertyName: string, value?: EntityPropertyTypes): void

    /**
     * Add a new entry to a property of the given entity. The type or value of the entry can be specified. New entries are always added to the end of the values of a property.
     * @param entityId Id of the entity where the property should be added.
     * @param propertyName Name of the property to add the entry to.
     * @param typeOrValue Value of the entry or type of the entry to add. It is possible to have a property with multiple entries of different types.
     */
    addPropertyEntry(
        entityId: string,
        propertyName: string,
        typeOrValue: PropertyType | EntitySinglePropertyTypes
    ): void

    /**
     * Set the value of a specific property entry. If the property does not exist, it will be created and the value will be inserted at index 0. If the entry at the given index does not exist, it will be created.
     * @param entityId Id of the entity where the property value should be set.
     * @param propertyName Name of the affected property.
     * @param valueIdx Index of the property entry to update. Must be at least 0.
     * @param value New value of the property entry.
     */
    modifyPropertyEntry(
        entityId: string,
        propertyName: string,
        valueIdx: number,
        value: EntitySinglePropertyTypes
    ): void

    /**
     * Remove a property entry by index of by its value. In the latter case, can only be used if the value is a reference ({@link IReference}). Will remove all entries matching the given reference.
     * @param entityId Id of the entity where the property should be removed.
     * @param propertyName Name of the affected property.
     * @param valueOrValueIdx Value of the property entry to remove. Can be either the index of the entry to remove, or the value of the entry to remove. The value must in this case be a reference ({@link IReference}). Entries with non-reference values cannot be removed by value.
     */
    removePropertyEntry(
        entityId: string,
        propertyName: string,
        valueOrValueIdx: number | IReference
    ): void

    /**
     * Revert an entity back to the backend state. Will result in the change status of this entity to become None.
     * @param entityId Id of the entity to revert.
     */
    revertEntity(entityId: string): void

    /**
     * Revert all entities back to the backend state.
     */
    revertAllEntities(): void

    showValidationDrawer: boolean
    setShowValidationDrawer(show: boolean): void

    /**
     * Used to set focus on a specific validation result. Allows the validation drawer to scroll to the result.
     */
    focusedValidationResultId?: string
    /**
     * Used to set focus on a specific validation result. Allows the validation drawer to scroll to the result.
     */
    setFocusedValidationResultId(id?: string): void
}

/**
 * Helper method that sets the value of a property by changing or creating the property.
 *
 * Follows these mutually exclusive rules:
 *  - If the property does not exist, it will be created and the value will be inserted at index 0.
 *  - If the property exists and has multiple entries, the value will be set at the specified valueIdx.
 *      - If no valueIdx is specified, the value will be appended to the end of the property instead.
 *  - If the property exists and has a single entry...
 *      - and valueIdx is specified and not 0, the value will be inserted at the specified valueIdx.
 *      - and valueIdx is not specified, the value will be inserted at index 1.
 *      - and valueIdx is 0, the value will replace the existing entry.
 *
 * This makes sure that values are only overwritten if the user intends to.
 *
 * @param entity Entity where the property should be set.
 * @param propertyName Name of the property to set.
 * @param value Value of the property to set.
 * @param valueIdx Optional index of the entry.
 */
function setPropertyValue(
    entity: Draft<IEntity>,
    propertyName: string,
    value: EntitySinglePropertyTypes,
    valueIdx?: number
) {
    if (propertyName in entity) {
        const prop = entity[propertyName]
        if (Array.isArray(prop)) {
            prop[valueIdx ?? prop.length] = value
        } else if (valueIdx === undefined || valueIdx > 0) {
            entity[propertyName] = [prop]
            ;(entity[propertyName] as EntitySinglePropertyTypes[])[valueIdx ?? 1] = value
        } else {
            entity[propertyName] = value
        }
    } else {
        entity[propertyName] = value
    }
}

/**
 * Monotonic counter to prevent out-of-order async context updates
 */
let contextUpdateSeq = 0
let initialContextUpdateSeq = 0

export const editorState = createWithEqualityFn<EditorState>()(
    ssrSafe(
        immer<EditorState>((setState, getState) => ({
            initialCrateContext: new CrateContext(),
            crateContext: new CrateContext(),
            crateContextReady: false,
            initialEntities: new Map<string, IEntity>(),
            entities: new Map<string, IEntity>(),

            updateCrateContext(crateContext: CrateContextType) {
                if (getState().crateContextReady && getState().crateContext.isSameAs(crateContext))
                    return

                const seq = ++contextUpdateSeq

                setState((s) => {
                    s.crateContextReady = false
                })
                const newContext = new CrateContext()
                newContext.setup(crateContext).then(() => {
                    if (contextUpdateSeq !== seq) return
                    setState((state) => {
                        state.crateContextReady = true
                        state.crateContext = newContext
                    })
                })
            },

            updateInitialCrateContext(crateContext: CrateContextType) {
                if (getState().initialCrateContext.isSameAs(crateContext)) return

                const seq = ++initialContextUpdateSeq

                const newContext = new CrateContext()
                newContext.setup(crateContext).then(() => {
                    if (initialContextUpdateSeq !== seq) return
                    setState((state) => {
                        state.initialCrateContext = newContext
                    })
                })
            },

            getEntities(): Map<string, IEntity> {
                return getState().entities
            },

            setEntities(data: Map<string, IEntity>) {
                setState((state) => {
                    state.entities = data
                })
            },

            setInitialEntities(data: Map<string, IEntity>) {
                setState((state) => {
                    state.initialEntities = data
                })
            },

            getEntitiesChangelist(): Map<string, Diff> {
                const changelist = new Map<string, Diff>()
                const entities = getState().entities
                for (const [entityId] of entities) {
                    const diff = getState().getEntityDiff(entityId)
                    if (diff !== null) changelist.set(entityId, diff)
                }
                return changelist
            },

            getEntityDiff(id: string): Diff | null {
                const entity = getState().entities.get(id)
                if (!entity) return null
                const initialEntity = getState().initialEntities.get(id)
                if (!initialEntity) return Diff.New
                if (isEntityEqual(entity, initialEntity)) {
                    return Diff.None
                } else return Diff.Changed
            },

            getRootEntityId(): string | undefined {
                return getRootEntityID(getState().entities)

            },

            getChangedEntities(): IEntity[] {
                const result = []
                for (const [id, diff] of getState().getEntitiesChangelist().entries()) {
                    if (diff !== Diff.None) {
                        result.push(id)
                    }
                }

                const entities = getState().getEntities()
                return result
                    .map((id) => entities.get(id))
                    .filter((e) => e !== undefined) as IEntity[]
            },

            getHasUnsavedChanges(): boolean {
                return (
                    Array.from(getState().getEntitiesChangelist().values()).find(
                        (diff) => diff === Diff.Changed || diff === Diff.New
                    ) !== undefined
                )
            },

            addEntity(
                entityId: string,
                types: string[],
                properties?: Record<string, EntityPropertyTypes>,
                autoReference?: AutoReference
            ): IEntity | undefined {
                if (!getState().entities.has(entityId)) {
                    const entity = {
                        ...properties,
                        "@id": entityId,
                        "@type": types
                    }

                    setState((state) => {
                        state.entities.set(entityId, entity)

                        if (autoReference) {
                            const target = state.entities.get(autoReference.entityId)
                            if (target) {
                                setPropertyValue(
                                    target,
                                    autoReference.propertyName,
                                    { "@id": entityId },
                                    autoReference.valueIdx
                                )
                            }
                        }
                    })

                    return entity
                } else return undefined
            },

            addProperty(entityId: string, propertyName: string, value?: EntityPropertyTypes) {
                const target = getState().entities.get(entityId)
                if (target && !(propertyName in target)) {
                    setState((state) => {
                        state.entities.get(entityId)![propertyName] = value ?? []
                    })
                }
            },

            addPropertyEntry(
                entityId: string,
                propertyName: string,
                typeOrValue: PropertyType | EntitySinglePropertyTypes
            ) {
                if (getState().entities.get(entityId)) {
                    setState((state) => {
                        setPropertyValue(
                            state.entities.get(entityId)!,
                            propertyName,
                            typeof typeOrValue === "number"
                                ? getPropertyTypeDefaultValue(typeOrValue)
                                : typeOrValue
                        )
                    })
                }
            },

            modifyPropertyEntry(
                entityId: string,
                propertyName: string,
                valueIdx: number,
                value: EntitySinglePropertyTypes
            ) {
                if (getState().entities.get(entityId)) {
                    setState((state) => {
                        setPropertyValue(
                            state.entities.get(entityId)!,
                            propertyName,
                            value,
                            valueIdx
                        )
                    })
                }
            },

            removePropertyEntry(
                entityId: string,
                propertyName: string,
                valueOrValueIdx: number | IReference
            ) {
                if (
                    getState().entities.get(entityId) &&
                    propertyName in getState().entities.get(entityId)!
                ) {
                    setState((state) => {
                        let target = state.entities.get(entityId)!
                        const prop = target[propertyName]
                        if (Array.isArray(prop)) {
                            if (prop.length === 1) {
                                delete target[propertyName]
                            } else {
                                if (typeof valueOrValueIdx === "number") {
                                    prop.splice(valueOrValueIdx, 1)
                                } else {
                                    target[propertyName] = prop.filter((val) =>
                                        typeof val === "object"
                                            ? val["@id"] !== valueOrValueIdx["@id"]
                                            : true
                                    )
                                }
                            }
                        } else {
                            delete target[propertyName]
                        }
                    })
                }
            },

            revertEntity(entityId: string) {
                const original = getState().initialEntities.get(entityId)
                if (original) {
                    setState((state) => {
                        state.entities.set(entityId, original)
                    })
                } else {
                    setState((state) => {
                        state.entities.delete(entityId)
                    })
                }
            },

            revertAllEntities() {
                setState((state) => {
                    state.entities = new Map(state.initialEntities)
                })
            },

            showValidationDrawer: false,
            setShowValidationDrawer(show: boolean) {
                setState((state) => {
                    state.showValidationDrawer = show
                })
            },
            focusedValidationResultId: undefined,
            setFocusedValidationResultId(id?: string) {
                setState((state) => {
                    state.focusedValidationResultId = id
                })
            }
        }))
    )
)

export function useEditorState<T>(selector: (store: EditorState) => T): T {
    return useStore(editorState, selector)
}
