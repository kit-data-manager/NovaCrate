"use client"

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { PropertyEditor, PropertyEditorTypes } from "@/components/editor/property-editor"
import {
    getEntityDisplayName,
    isDataEntity as isDataEntityUtil,
    isRootEntity as isRootEntityUtil
} from "@/lib/utils"
import { WebWorkerWarning } from "@/components/web-worker-warning"
import { EntityEditorTabsContext } from "@/components/entity-tabs-provider"
import { CrateDataContext } from "@/components/crate-data-provider"
import { Error } from "@/components/error"
import { EntityEditorHeader } from "@/components/editor/entity-editor-header"

type PropertyHasChangesEnum = "no" | "hasChanges" | "isNew"

export interface EntityEditorProperty {
    propertyName: string
    values: FlatEntitySinglePropertyTypes[]
}

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
        .sort(byPropertyName)
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

// Sorting function
function byPropertyName(a: EntityEditorProperty, b: EntityEditorProperty) {
    if (a.propertyName === "name" && b.propertyName === "name") return 0
    if (a.propertyName === "name" && !b.propertyName.startsWith("@")) return -1
    if (b.propertyName === "name" && !a.propertyName.startsWith("@")) return 1
    if (a.propertyName === b.propertyName) return 0
    return a.propertyName > b.propertyName ? 1 : -1
}

export function EntityEditor({
    entityData,
    editorState,
    dirty
}: {
    entityData: IFlatEntity
    editorState: EntityEditorProperty[]
    dirty: boolean
}) {
    const { updateTab } = useContext(EntityEditorTabsContext)
    const { updateEntity } = useContext(CrateDataContext)

    const [saveError, setSaveError] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    const editorStateRef = useRef(editorState)
    useEffect(() => {
        editorStateRef.current = editorState
    }, [editorState])

    const initialProperties = useMemo(() => {
        return mapEntityToProperties(entityData)
    }, [entityData])

    const propertyHasChanges: PropertyHasChangesEnum[] = useMemo(() => {
        return editorState.map((prop) => {
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
    }, [initialProperties, editorState])

    const hasUnsavedChanges = useMemo(() => {
        return propertyHasChanges.filter((p) => p !== "no").length > 0
    }, [propertyHasChanges])

    useEffect(() => {
        if (dirty !== hasUnsavedChanges)
            updateTab({
                entityId: entityData["@id"],
                dirty: hasUnsavedChanges
            })
    }, [dirty, entityData, hasUnsavedChanges, updateTab])

    const modifyProperties = useCallback(
        (modifiedProperties: EntityEditorProperty[]) => {
            updateTab({
                entityId: entityData["@id"],
                editorState: modifiedProperties
            })
        },
        [entityData, updateTab]
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
            const propertyIndex = editorState.findIndex((p) => p.propertyName === propertyName)
            if (propertyIndex < 0 || propertyIndex >= editorState.length) return
            const property = editorState[propertyIndex]
            if (property.values.length > 1) {
                property.values.splice(valueIdx)
            } else {
                editorState.splice(propertyIndex)
            }
            modifyProperties(editorState)
        },
        [modifyProperties, editorState]
    )

    const addProperty = useCallback(
        (propertyName: string, values: FlatEntitySinglePropertyTypes[]) => {
            editorState.push({
                propertyName,
                values
            })
            modifyProperties(editorState)
        },
        [modifyProperties, editorState]
    )

    const saveChanges = useCallback(() => {
        if (!hasUnsavedChanges) return

        setIsSaving(true)
        updateEntity(mapPropertiesToEntity(editorStateRef.current))
            .then((b) => {
                console.log("done with update", b)
                setSaveError("")
            })
            .catch((e) => {
                setSaveError(e + "")
            })
            .finally(() => {
                setIsSaving(false)
            })
    }, [hasUnsavedChanges, updateEntity])

    const isRootEntity = useMemo(() => {
        return isRootEntityUtil(entityData)
    }, [entityData])

    const isDataEntity = useMemo(() => {
        return isDataEntityUtil(entityData)
    }, [entityData])

    return (
        <div className="relative">
            <EntityEditorHeader
                hasUnsavedChanges={hasUnsavedChanges}
                isSaving={isSaving}
                saveChanges={saveChanges}
            />

            <div className="p-4 mr-10">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold flex items-center">
                        {getEntityDisplayName(entityData)}

                        <div
                            className={`${isRootEntity ? "border-root text-root" : isDataEntity ? "border-data text-data" : "border-contextual text-contextual"}  border px-1.5 rounded ml-6 text-sm`}
                        >
                            {isRootEntity ? "Root" : isDataEntity ? "Data" : "Contextual"}
                        </div>
                        {/*<div className="border-success border text-success px-1.5 rounded ml-2 text-sm flex gap-1 items-center">*/}
                        {/*    <Check className="w-4 h-4" /> ORCID*/}
                        {/*</div>*/}
                    </h2>

                    {/*<div className="flex items-center mr-2">*/}
                    {/*    <Switch id="easy-mode" />*/}
                    {/*    <Label className="p-2" htmlFor="easy-mode">*/}
                    {/*        Easy Mode*/}
                    {/*    </Label>*/}
                    {/*</div>*/}
                </div>

                <WebWorkerWarning />
                <Error
                    className="mt-4"
                    text={saveError ? "Error while saving: " + saveError : ""}
                />

                <div className="my-12 flex flex-col gap-10 mr-2">
                    {editorState.map((property, i) => {
                        return (
                            <div key={property.propertyName}>
                                <PropertyEditor
                                    property={property}
                                    onModifyProperty={modifyProperty}
                                    onAddPropertyEntry={addPropertyEntry}
                                    hasChanges={propertyHasChanges[i] === "hasChanges"}
                                    isNew={propertyHasChanges[i] === "isNew"}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

function hasChanged(value: string | IReference, oldValue: string | IReference) {
    if (typeof value === "string" && typeof oldValue === "string") {
        return value !== oldValue
    } else if (typeof value === "object" && typeof oldValue === "object") {
        return value["@id"] !== oldValue["@id"]
    } else return true
}
