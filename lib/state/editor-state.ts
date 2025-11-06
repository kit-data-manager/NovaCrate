import { immer } from "zustand/middleware/immer"
import { Draft, enableMapSet } from "immer"
import { AutoReference, Diff, isEntityEqual } from "@/lib/utils"
import { CrateContext } from "@/lib/crate-context"
import { createWithEqualityFn } from "zustand/traditional"
import { useStore } from "zustand"
import { getPropertyTypeDefaultValue, PropertyType } from "@/lib/property"
import { PropertyValueUtils } from "@/lib/property-value-utils"

enableMapSet()

export interface EditorState {
    initialCrateContext: CrateContext
    crateContext: CrateContext
    crateContextReady: boolean

    updateInitialCrateContext(crateContext: CrateContextType): void
    updateCrateContext(crateContext: CrateContextType): void

    initialEntities: Map<string, IEntity>
    entities: Map<string, IEntity>

    setInitialEntities(data: Map<string, IEntity>): void
    setEntities(data: Map<string, IEntity>): void

    getEntities(): Map<string, IEntity>
    getEntitiesChangelist(): Map<string, Diff>
    getEntityDiff(id: string): Diff | null
    getRootEntityId(): string | undefined
    getChangedEntities(): IEntity[]
    getHasUnsavedChanges(): boolean
    addEntity(
        entityId: string,
        types: string[],
        properties?: Record<string, EntityPropertyTypes>,
        autoReference?: AutoReference
    ): IEntity | undefined
    removeEntity(entityId: string): void
    addProperty(entityId: string, propertyName: string, value?: EntityPropertyTypes): void
    addPropertyEntry(
        entityId: string,
        propertyName: string,
        typeOrValue: PropertyType | EntitySinglePropertyTypes
    ): void
    setPropertyValue(
        entityId: string,
        propertyName: string,
        value: EntitySinglePropertyTypes,
        valueIdx?: number
    ): void
    modifyPropertyEntry(
        entityId: string,
        propertyName: string,
        valueIdx: number,
        value: EntitySinglePropertyTypes
    ): void
    removePropertyEntry(
        entityId: string,
        propertyName: string,
        valueOrValueIdx: number | EntitySinglePropertyTypes
    ): void
    revertEntity(entityId: string): void
    revertAllEntities(): void

    showValidationDrawer: boolean
    setShowValidationDrawer(show: boolean): void
    focusedValidationResultId?: string
    setFocusedValidationResultId(id?: string): void
}

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

export const editorState = createWithEqualityFn<EditorState>()(
    immer<EditorState>((setState, getState) => ({
        initialCrateContext: new CrateContext(),
        crateContext: new CrateContext(),
        crateContextReady: false,
        initialEntities: new Map<string, IEntity>(),
        entities: new Map<string, IEntity>(),

        updateCrateContext(crateContext: CrateContextType) {
            if (getState().crateContextReady && getState().crateContext.isSameAs(crateContext))
                return

            setState((s) => {
                s.crateContextReady = false
            })
            const newContext = new CrateContext()
            newContext.setup(crateContext).then(() => {
                setState((state) => {
                    state.crateContextReady = true
                    state.crateContext = newContext
                })
            })
        },

        updateInitialCrateContext(crateContext: CrateContextType) {
            if (getState().initialCrateContext.isSameAs(crateContext)) return

            const newContext = new CrateContext()
            newContext.setup(crateContext).then(() => {
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
            const entities = getState().entities
            const meta = entities.get("ro-crate-metadata.json")
            const legacy = entities.get("ro-crate-metadata.jsonld")
            if (meta && "about" in meta && PropertyValueUtils.isRef(meta.about))
                return meta.about["@id"]
            if (legacy && "about" in legacy && PropertyValueUtils.isRef(legacy.about))
                return legacy.about["@id"]
        },

        getChangedEntities(): IEntity[] {
            const result = []
            for (const [id, diff] of getState().getEntitiesChangelist().entries()) {
                if (diff !== Diff.None) {
                    result.push(id)
                }
            }

            const entities = getState().getEntities()
            return result.map((id) => entities.get(id)).filter((e) => e !== undefined) as IEntity[]
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

        removeEntity(entityId: string) {
            setState((state) => {
                state.entities.delete(entityId)
            })
        },

        addProperty(entityId: string, propertyName: string, value?: EntityPropertyTypes) {
            const target = getState().entities.get(entityId)
            if (target && !(propertyName in target)) {
                setState((state) => {
                    state.entities.get(entityId)![propertyName] = value || []
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

        setPropertyValue(
            entityId: string,
            propertyName: string,
            value: EntitySinglePropertyTypes,
            valueIdx?: number
        ) {
            if (getState().entities.get(entityId)) {
                setState((state) => {
                    setPropertyValue(state.entities.get(entityId)!, propertyName, value, valueIdx)
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
                    setPropertyValue(state.entities.get(entityId)!, propertyName, value, valueIdx)
                })
            }
        },

        removePropertyEntry(
            entityId: string,
            propertyName: string,
            valueOrValueIdx: number | EntitySinglePropertyTypes
        ) {
            if (
                getState().entities.get(entityId) &&
                propertyName in getState().entities.get(entityId)!
            ) {
                setState((state) => {
                    const target = state.entities.get(entityId)!
                    const prop = target[propertyName]
                    if (Array.isArray(prop)) {
                        if (prop.length === 1) {
                            delete target[propertyName]
                        } else {
                            if (typeof valueOrValueIdx === "number") {
                                prop.splice(valueOrValueIdx, 1)
                            } else {
                                if (typeof valueOrValueIdx === "object") {
                                    const i = prop.findIndex((val) =>
                                        typeof val === "object"
                                            ? val["@id"] === valueOrValueIdx["@id"]
                                            : false
                                    )
                                    if (i >= 0) prop.splice(i, 1)
                                } else {
                                    const i = prop.findIndex((val) =>
                                        typeof val === "string" ? val === valueOrValueIdx : false
                                    )
                                    if (i >= 0) prop.splice(i, 1)
                                }
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

export function useEditorState<T>(selector: (store: EditorState) => T): T {
    return useStore(editorState, selector)
}
