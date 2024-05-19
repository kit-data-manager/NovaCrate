import { AutoReference } from "@/components/global-modals-provider"
import { immer } from "zustand/middleware/immer"
import { Draft, enableMapSet } from "immer"
import { createSelectorHooks, ZustandHookSelectors } from "auto-zustand-selectors-hook"
import { PropertyEditorTypes } from "@/components/editor/property-editor"
import { Diff, isEntityEqual } from "@/lib/utils"
import { temporal } from "zundo"
import { CrateContext } from "@/lib/crate-context"
import { createWithEqualityFn } from "zustand/traditional"

enableMapSet()

export interface ICrateEditorContext {
    initialCrateContext: CrateContext
    crateContext: CrateContext

    setInitialCrateContext(crateContext: CrateContextType): void
    setCrateContext(crateContext: CrateContextType): void

    revertContext(): void

    initialEntities: Map<string, IFlatEntity>
    entities: Map<string, IFlatEntity>

    setInitialEntities(data: Map<string, IFlatEntity>): void
    setEntities(data: Map<string, IFlatEntity>): void

    getEntities(): Map<string, IFlatEntity>
    getEntitiesChangelist(): Map<string, Diff>
    getHasUnsavedChanges(): boolean
    addEntity(
        entityId: string,
        types: string[],
        properties?: Record<string, FlatEntityPropertyTypes>,
        autoReference?: AutoReference
    ): IFlatEntity | undefined
    removeEntity(entityId: string): void
    addProperty(entityId: string, propertyName: string, value?: FlatEntityPropertyTypes): void
    addPropertyEntry(entityId: string, propertyName: string, type: PropertyEditorTypes): void
    modifyPropertyEntry(
        entityId: string,
        propertyName: string,
        valueIdx: number,
        value: FlatEntitySinglePropertyTypes
    ): void
    removePropertyEntry(entityId: string, propertyName: string, valueIdx: number): void
    revertEntity(entityId: string): void
    revertAllEntities(): void
}

function setPropertyValue(
    entity: Draft<IFlatEntity>,
    propertyName: string,
    value: FlatEntitySinglePropertyTypes,
    valueIdx?: number
) {
    if (propertyName in entity) {
        const prop = entity[propertyName]
        if (Array.isArray(prop)) {
            prop[valueIdx ?? prop.length] = value
        } else if (valueIdx === undefined || valueIdx > 0) {
            entity[propertyName] = [prop]
            ;(entity[propertyName] as FlatEntitySinglePropertyTypes[])[valueIdx ?? 1] = value
        } else {
            entity[propertyName] = value
        }
    } else {
        entity[propertyName] = value
    }
}

const editorStateBase = createWithEqualityFn<ICrateEditorContext>()(
    temporal(
        immer<ICrateEditorContext>((setState, getState) => ({
            initialCrateContext: new CrateContext([]),
            crateContext: new CrateContext([]),
            initialEntities: new Map<string, IFlatEntity>(),
            entities: new Map<string, IFlatEntity>(),

            setCrateContext(crateContext: CrateContextType) {
                setState((state) => {
                    state.crateContext = new CrateContext(crateContext)
                })
            },

            setInitialCrateContext(crateContext: CrateContextType) {
                setState((state) => {
                    state.initialCrateContext = new CrateContext(crateContext)
                })
            },

            revertContext() {
                setState((state) => {
                    state.crateContext = new CrateContext(state.initialCrateContext.raw)
                })
            },

            getEntities(): Map<string, IFlatEntity> {
                return getState().entities
            },

            setEntities(data: Map<string, IFlatEntity>) {
                setState((state) => {
                    state.entities = data
                })
            },

            setInitialEntities(data: Map<string, IFlatEntity>) {
                setState((state) => {
                    state.initialEntities = data
                })
            },

            getEntitiesChangelist(): Map<string, Diff> {
                const changelist = new Map<string, Diff>()
                const entities = getState().entities
                const initialEntities = getState().initialEntities
                for (const [entityId, entity] of entities) {
                    if (!initialEntities.has(entityId)) {
                        changelist.set(entityId, Diff.New)
                        continue
                    }
                    const original = initialEntities.get(entityId)!
                    if (isEntityEqual(original, entity)) {
                        changelist.set(entityId, Diff.None)
                    } else changelist.set(entityId, Diff.Changed)
                }
                return changelist
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
                properties?: Record<string, FlatEntityPropertyTypes>,
                autoReference?: AutoReference
            ): IFlatEntity | undefined {
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

            addProperty(entityId: string, propertyName: string, value?: FlatEntityPropertyTypes) {
                const target = getState().entities.get(entityId)
                if (target && !(propertyName in target)) {
                    setState((state) => {
                        state.entities.get(entityId)![propertyName] = value || []
                    })
                }
            },

            addPropertyEntry(entityId: string, propertyName: string, type: PropertyEditorTypes) {
                if (getState().entities.get(entityId)) {
                    setState((state) => {
                        setPropertyValue(
                            state.entities.get(entityId)!,
                            propertyName,
                            type === PropertyEditorTypes.Reference ? { "@id": "" } : ""
                        )
                    })
                }
            },

            modifyPropertyEntry(
                entityId: string,
                propertyName: string,
                valueIdx: number,
                value: FlatEntitySinglePropertyTypes
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

            removePropertyEntry(entityId: string, propertyName: string, valueIdx: number) {
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
                                prop.splice(valueIdx, 1)
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
            }
        }))
    )
)

export const useEditorState = createSelectorHooks(editorStateBase) as typeof editorStateBase &
    ZustandHookSelectors<ICrateEditorContext>
