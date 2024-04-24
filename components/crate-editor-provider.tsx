"use client"

import { PropertyEditorTypes } from "@/components/editor/property-editor"
import {
    createContext,
    PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react"
import { CrateDataContext } from "@/components/crate-data-provider"
import { Context } from "@/lib/context"
import isEqual from "react-fast-compare"

export enum Diff {
    None,
    Changed,
    New
}

export interface ICrateEditorContext {
    rawCrateContext: CrateContext
    crateContext: Context
    setRawCrateContext(crateContext: CrateContext): void
    revertContext(): void

    entities: IFlatEntity[]
    entitiesChangelist: Map<string, Diff>
    addEntity(entityId: string, types: string[]): void
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

    canUndo: boolean
    canRedo: boolean
    undo(): void
    redo(): void

    isSaving: boolean
    saveError?: string
    saveContext(): void
    saveEntity(entityId: string): void
    saveAllEntities(): void
    revertAllEntities(): void
}

export const CrateEditorContext = createContext<ICrateEditorContext>({
    rawCrateContext: [],
    crateContext: new Context([]),
    setRawCrateContext() {
        throw "CrateEditorContext not mounted"
    },
    revertContext() {
        throw "CrateEditorContext not mounted"
    },

    entities: [],
    entitiesChangelist: new Map(),
    addEntity() {
        throw "CrateEditorContext not mounted"
    },
    addProperty() {
        throw "CrateEditorContext not mounted"
    },
    addPropertyEntry() {
        throw "CrateEditorContext not mounted"
    },
    modifyPropertyEntry() {
        throw "CrateEditorContext not mounted"
    },
    removePropertyEntry() {
        throw "CrateEditorContext not mounted"
    },

    revertEntity() {
        throw "CrateEditorContext not mounted"
    },

    canRedo: false,
    canUndo: false,
    undo() {
        throw "CrateEditorContext not mounted"
    },
    redo() {
        throw "CrateEditorContext not mounted"
    },

    isSaving: false,
    saveContext() {
        throw "CrateEditorContext not mounted"
    },
    saveEntity() {
        throw "CrateEditorContext not mounted"
    },
    saveAllEntities() {
        throw "CrateEditorContext not mounted"
    },
    revertAllEntities() {
        throw "CrateEditorContext not mounted"
    }
})

/**
 * Internal helper function to simplify all the functions that modify an entity
 * @param entityId ID of the entity to modify
 * @param entities List of all entities or null
 * @param callback Will be called in the entity in the entities array with @id === entityID. Won't be called when the entity couldn't be found or entities is null
 */
function modifyEntityHelper(
    entityId: string,
    entities: IFlatEntity[] | null,
    callback: (entity: IFlatEntity) => IFlatEntity
) {
    if (!entities) return null

    const entityIdx = entities.findIndex((e) => e["@id"] === entityId)
    if (entityIdx < 0) return entities
    const entity = entities[entityIdx]
    const newEntity = callback({ ...entity })
    const newEntities = [...entities]
    newEntities[entityIdx] = newEntity
    return newEntities
}

export function CrateEditorProvider(props: PropsWithChildren) {
    const { crateData, updateEntity } = useContext(CrateDataContext)
    const crateDataRef = useRef(crateData)
    useEffect(() => {
        crateDataRef.current = crateData
    }, [crateData])

    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState("")

    const [internalCrateContext, setInternalCrateContext] = useState<CrateContext | null>(null)

    const rawCrateContext: CrateContext = useMemo(() => {
        if (internalCrateContext === null) {
            return crateData?.["@context"] || []
        } else return internalCrateContext
    }, [crateData, internalCrateContext])

    const crateContext = useMemo(() => {
        return new Context(internalCrateContext || [])
    }, [internalCrateContext])

    useEffect(() => {
        setInternalCrateContext((oldInternalCrateContext) => {
            if (oldInternalCrateContext === null && crateData) {
                return crateData["@context"]
            } else return oldInternalCrateContext
        })
    }, [crateData])

    const [internalEntities, setInternalEntities] = useState<IFlatEntity[] | null>(null)

    const entities = useMemo(() => {
        if (internalEntities === null) {
            if (crateData) {
                const clone = structuredClone(crateData["@graph"])
                setInternalEntities(clone)
                return clone
            } else {
                return []
            }
        } else return internalEntities
    }, [crateData, internalEntities])

    const entitiesChangelist = useMemo(() => {
        const changelist = new Map<string, Diff>()
        for (const entity of entities) {
            if (!crateData) {
                changelist.set(entity["@id"], Diff.New)
                continue
            }
            const original = crateData["@graph"].find((e) => e["@id"] === entity["@id"])
            if (!original) {
                changelist.set(entity["@id"], Diff.New)
                continue
            }

            if (isEqual(original, entity)) {
                changelist.set(entity["@id"], Diff.None)
            } else changelist.set(entity["@id"], Diff.Changed)
        }
        return changelist
    }, [crateData, entities])

    const addEntity = useCallback((entityId: string, types: string | string[]) => {
        setInternalEntities((oldEntities) => {
            if (!oldEntities) return null

            const copy = [...oldEntities]
            copy.push({
                "@id": entityId,
                "@type": types
            })
            return copy
        })
    }, [])

    const modifyPropertyEntry = useCallback(
        (
            entityId: string,
            propertyName: string,
            valueIdx: number,
            value: FlatEntitySinglePropertyTypes
        ) => {
            setInternalEntities((oldEntities) =>
                modifyEntityHelper(entityId, oldEntities, (entity) => {
                    if (propertyName in entity) {
                        const prop = entity[propertyName]
                        if (Array.isArray(prop)) {
                            const copy = [...prop]
                            copy[valueIdx] = value
                            entity[propertyName] = copy
                        } else {
                            entity[propertyName] = value
                        }
                    }
                    return entity
                })
            )
        },
        []
    )

    const addProperty = useCallback(
        (entityId: string, propertyName: string, value: FlatEntityPropertyTypes) => {
            setInternalEntities((oldEntities) =>
                modifyEntityHelper(entityId, oldEntities, (entity) => {
                    if (!(propertyName in entity)) {
                        entity[propertyName] = value
                    }
                    return entity
                })
            )
        },
        []
    )

    const addPropertyEntry = useCallback(
        (entityId: string, propertyName: string, type: PropertyEditorTypes) => {
            setInternalEntities((oldEntities) =>
                modifyEntityHelper(entityId, oldEntities, (entity) => {
                    const value = type === PropertyEditorTypes.Reference ? { "@id": "" } : ""

                    if (propertyName in entity) {
                        const prop = entity[propertyName]
                        if (Array.isArray(prop)) {
                            const copy = [...prop]
                            copy.push(value)
                            entity[propertyName] = copy
                        } else {
                            entity[propertyName] = [prop, value]
                        }
                    }

                    return entity
                })
            )
        },
        []
    )

    const removePropertyEntry = useCallback(
        (entityId: string, propertyName: string, valueIdx: number) => {
            setInternalEntities((oldEntities) =>
                modifyEntityHelper(entityId, oldEntities, (entity) => {
                    if (propertyName in entity) {
                        const prop = entity[propertyName]
                        if (Array.isArray(prop) && prop.length > 1) {
                            const copy = [...prop]
                            copy.splice(valueIdx, 1)
                            entity[propertyName] = copy
                        } else {
                            delete entity[propertyName]
                        }
                    }

                    return entity
                })
            )
        },
        []
    )

    const revertEntity = useCallback((entityId: string) => {
        setInternalEntities((oldEntities) => {
            if (oldEntities == null) return null

            if (crateDataRef.current) {
                const entity = crateDataRef.current["@graph"].find((e) => e["@id"] === entityId)
                const internalIdx = oldEntities.findIndex((e) => e["@id"] === entityId)
                if (!entity || internalIdx < 0) return oldEntities
                const copy = [...oldEntities]
                copy[internalIdx] = entity
                return copy
            } else return oldEntities
        })
    }, [])

    const saveEntity = useCallback(
        (entityId: string) => {
            const entity = entities.find((e) => e["@id"] === entityId)
            if (entity) {
                setIsSaving(true)
                updateEntity(entity)
                    .catch((e) => {
                        setSaveError(e + "")
                    })
                    .finally(() => {
                        setIsSaving(false)
                    })
            }
        },
        [entities, updateEntity]
    )

    return (
        <CrateEditorContext.Provider
            value={{
                crateContext,
                rawCrateContext,
                setRawCrateContext: setInternalCrateContext,
                revertContext() {},

                entities,
                entitiesChangelist,
                addEntity,
                addProperty,
                addPropertyEntry,
                modifyPropertyEntry,
                removePropertyEntry,
                revertEntity,

                canUndo: false,
                canRedo: false,
                undo() {},
                redo() {},

                isSaving,
                saveError,
                saveContext() {},
                saveEntity,
                saveAllEntities() {},
                revertAllEntities() {}
            }}
        >
            {props.children}
        </CrateEditorContext.Provider>
    )
}
