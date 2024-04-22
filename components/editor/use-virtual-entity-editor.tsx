import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { PropertyEditorTypes } from "@/components/editor/property-editor"
import { EntityEditorTabsContext } from "@/components/entity-tabs-provider"
import { CrateDataContext } from "@/components/crate-data-provider"

export interface EntityEditorProperty {
    propertyName: string
    values: FlatEntitySinglePropertyTypes[]
}

export type EntityEditorProps = ReturnType<typeof useVirtualEntityEditor>
export type EntityEditorCallbacks = Pick<
    EntityEditorProps,
    | "addProperty"
    | "addPropertyEntry"
    | "modifyProperty"
    | "removeProperty"
    | "saveChanges"
    | "revertChanges"
>

type PropertyHasChangesEnum = "no" | "hasChanges" | "isNew"

export function mapEntityToProperties(data: IFlatEntity): EntityEditorProperty[] {
    return Object.keys(data)
        .map((key) => {
            let value = data[key]
            let arrValue: FlatEntitySinglePropertyTypes[]
            if (!Array.isArray(value)) {
                arrValue = [value]
            } else {
                arrValue = value.slice()
            }

            return {
                propertyName: key,
                values: arrValue
            }
        })
        .flat()
        .sort(sortByPropertyName)
}

export function mapPropertiesToEntity(data: EntityEditorProperty[]): IFlatEntity {
    const result: Record<string, FlatEntityPropertyTypes> = {}

    function autoUnpack(value: FlatEntitySinglePropertyTypes[]) {
        if (value.length === 1) return value[0]
        else return value
    }

    for (const property of data) {
        if (property.values.length === 0) continue
        result[property.propertyName] = autoUnpack(property.values)
    }

    if (!("@id" in result)) throw "Mapping properties to entity failed, no @id property"
    if (!("@type" in result)) throw "Mapping properties to entity failed, no @id property"

    return result as IFlatEntity
}

/**
 *
 * @param entityId ID of the entity
 * @param propertyEditorStates Property editor states
 * @param entityData Original entity data. If not provided, this entity editor assumes it is creating a new entity
 */
export function useVirtualEntityEditor(
    entityId: string,
    propertyEditorStates: EntityEditorProperty[],
    entityData?: IFlatEntity
) {
    const { updateTab } = useContext(EntityEditorTabsContext)
    const { updateEntity } = useContext(CrateDataContext)

    const [saveError, setSaveError] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    const editorStateRef = useRef(propertyEditorStates)
    useEffect(() => {
        editorStateRef.current = propertyEditorStates
    }, [propertyEditorStates])

    const initialProperties = useMemo(() => {
        return entityData ? mapEntityToProperties(entityData) : []
    }, [entityData])

    const propertyHasChanges: PropertyHasChangesEnum[] = useMemo(() => {
        return propertyEditorStates.map((prop) => {
            const initialProp = initialProperties.find((p) => p.propertyName === prop.propertyName)
            if (initialProp) {
                if (prop.values.length !== initialProp.values.length) {
                    return "hasChanges"
                }
                if (
                    prop.values.filter((val, i) => hasChanged(val, initialProp.values[i])).length >
                    0
                ) {
                    return "hasChanges"
                }
                return "no"
            } else {
                return "isNew"
            }
        })
    }, [initialProperties, propertyEditorStates])

    const hasUnsavedChanges = useMemo(() => {
        return propertyHasChanges.filter((p) => p !== "no").length > 0
    }, [propertyHasChanges])

    useEffect(() => {
        updateTab({
            entityId: entityId,
            dirty: hasUnsavedChanges
        })
    }, [entityData, entityId, hasUnsavedChanges, updateTab])

    const modifyProperties = useCallback(
        (modifiedProperties: EntityEditorProperty[]) => {
            updateTab({
                entityId: entityId,
                propertyEditorStates: modifiedProperties
            })
        },
        [entityId, updateTab]
    )

    const modifyProperty = useCallback(
        (propertyName: string, value: FlatEntitySinglePropertyTypes, valueIdx: number) => {
            const propertyIndex = editorStateRef.current.findIndex(
                (p) => p.propertyName === propertyName
            )
            if (propertyIndex < 0 || propertyIndex >= editorStateRef.current.length) return
            const property = editorStateRef.current[propertyIndex]
            if (!hasChanged(value, property.values[valueIdx])) return

            const newProperty = structuredClone(property)
            newProperty.values[valueIdx] = value
            const newEditorState = editorStateRef.current.slice()
            newEditorState.splice(propertyIndex, 1, newProperty)

            modifyProperties(newEditorState)
        },
        [modifyProperties]
    )

    const addPropertyEntry = useCallback(
        (propertyName: string, type: PropertyEditorTypes) => {
            const propertyIndex = editorStateRef.current.findIndex(
                (p) => p.propertyName === propertyName
            )
            if (propertyIndex < 0 || propertyIndex >= editorStateRef.current.length) return
            const property = editorStateRef.current[propertyIndex]

            const newProperty = structuredClone(property)
            newProperty.values.push(type === PropertyEditorTypes.Reference ? { "@id": "" } : "")
            const newEditorState = editorStateRef.current.slice()
            newEditorState.splice(propertyIndex, 1, newProperty)

            modifyProperties(newEditorState)
        },
        [modifyProperties]
    )

    const removeProperty = useCallback(
        (propertyName: string, valueIdx: number) => {
            const propertyIndex = editorStateRef.current.findIndex(
                (p) => p.propertyName === propertyName
            )
            if (propertyIndex < 0 || propertyIndex >= editorStateRef.current.length) return
            const property = editorStateRef.current[propertyIndex]

            const newEditorState = editorStateRef.current.slice()
            const newProperty = structuredClone(property)
            newProperty.values.splice(valueIdx, 1)
            newEditorState.splice(propertyIndex, 1, newProperty)

            modifyProperties(newEditorState)
        },
        [modifyProperties]
    )

    const addProperty = useCallback(
        (propertyName: string, values?: FlatEntitySinglePropertyTypes[]) => {
            const propertyIndex = editorStateRef.current.findIndex(
                (p) => p.propertyName === propertyName
            )
            if (propertyIndex >= 0 && propertyIndex < editorStateRef.current.length) return

            const newEditorState = editorStateRef.current.slice()
            newEditorState.push({
                propertyName,
                values: values || []
            })
            modifyProperties(newEditorState)
        },
        [modifyProperties]
    )

    const clearRemovedProperties = useCallback(() => {
        if (editorStateRef.current.find((p) => p.values.length === 0)) {
            const newEditorState = editorStateRef.current.slice().filter((p) => p.values.length > 0)
            modifyProperties(newEditorState)
        }
    }, [modifyProperties])

    const saveChanges = useCallback(() => {
        if (!hasUnsavedChanges) return

        setIsSaving(true)
        clearRemovedProperties()
        updateEntity(mapPropertiesToEntity(editorStateRef.current))
            .then((b) => {
                setSaveError(b ? "" : "Unknown error")
            })
            .catch((e) => {
                setSaveError(e + "")
            })
            .finally(() => {
                setIsSaving(false)
            })
    }, [clearRemovedProperties, hasUnsavedChanges, updateEntity])

    const revertChanges = useCallback(() => {
        if (entityData) modifyProperties(mapEntityToProperties(entityData))
    }, [entityData, modifyProperties])

    return {
        entityData,
        addProperty,
        removeProperty,
        addPropertyEntry,
        editorState: propertyEditorStates,
        revertChanges,
        modifyProperty,
        saveChanges,
        saveError,
        isSaving,
        hasUnsavedChanges,
        propertyHasChanges
    }
}

function sortByPropertyName(a: EntityEditorProperty, b: EntityEditorProperty) {
    if (a.propertyName === "name" && b.propertyName === "name") return 0
    if (a.propertyName === "name" && !b.propertyName.startsWith("@")) return -1
    if (b.propertyName === "name" && !a.propertyName.startsWith("@")) return 1
    if (a.propertyName === b.propertyName) return 0
    return a.propertyName > b.propertyName ? 1 : -1
}

function hasChanged(value: string | IReference, oldValue: string | IReference) {
    if (typeof value === "string" && typeof oldValue === "string") {
        return value !== oldValue
    } else if (typeof value === "object" && typeof oldValue === "object") {
        return value["@id"] !== oldValue["@id"]
    } else return true
}
