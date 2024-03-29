"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { PropertyEditor } from "@/components/editor/property-editor"

type PropertyHasChangesEnum = "no" | "hasChanges" | "isNew"

export interface EntityEditorProperty {
    propertyName: string
    values: FlatEntitySinglePropertyTypes[]
}

function mapEntityToProperties(data: IFlatEntity): EntityEditorProperty[] {
    return Object.keys(data)
        .filter((key) => key !== "@id")
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
}

export function EntityEditor({ entityData }: { entityData: IFlatEntity }) {
    const [initialProperties, setInitialProperties] = useState<EntityEditorProperty[]>(
        mapEntityToProperties(entityData)
    )
    const [properties, setProperties] = useState<EntityEditorProperty[]>(
        mapEntityToProperties(entityData)
    )

    useEffect(() => {
        setInitialProperties(mapEntityToProperties(entityData))
        setProperties(mapEntityToProperties(entityData))
    }, [entityData])

    const propertyHasChanges: PropertyHasChangesEnum[] = useMemo(() => {
        return properties.map((prop) => {
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
    }, [initialProperties, properties])

    const modifyProperty = useCallback(
        (propertyName: string, value: FlatEntitySinglePropertyTypes, valueIdx: number) => {
            const propertyIndex = properties.findIndex((p) => p.propertyName === propertyName)
            if (propertyIndex < 0 || propertyIndex >= properties.length) return
            const property = properties[propertyIndex]
            if (!hasChanged(value, property.values[valueIdx])) return

            property.propertyName = propertyName
            property.values[valueIdx] = value
            setProperties(properties.slice())
        },
        [properties]
    )

    const removeProperty = useCallback(
        (propertyName: string, valueIdx: number) => {
            const propertyIndex = properties.findIndex((p) => p.propertyName === propertyName)
            if (propertyIndex < 0 || propertyIndex >= properties.length) return
            const property = properties[propertyIndex]
            if (property.values.length > 1) {
                property.values.splice(valueIdx)
            } else {
                properties.splice(propertyIndex)
            }
            setProperties(properties.slice())
        },
        [properties]
    )

    const addProperty = useCallback(
        (propertyName: string, values: FlatEntitySinglePropertyTypes[]) => {
            properties.push({
                propertyName,
                values
            })
        },
        [properties]
    )

    return (
        <div className="max-w-[1200px]">
            <h2 className="text-3xl font-bold flex items-center">
                <span className="mb-1">{entityData["@type"]} </span>
                <span className="font-mono bg-secondary text-xl p-1 ml-4 rounded">
                    {entityData["@id"]}
                </span>
            </h2>

            <div className="mt-6 flex flex-col gap-10">
                {properties.map((property, i) => {
                    return (
                        <div key={property.propertyName}>
                            <PropertyEditor
                                property={property}
                                onModifyProperty={modifyProperty}
                                hasChanges={propertyHasChanges[i] === "hasChanges"}
                                isNew={propertyHasChanges[i] === "isNew"}
                            />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function hasChanged(value: string | Reference, oldValue: string | Reference) {
    if (typeof value === "string" && typeof oldValue === "string") {
        return value !== oldValue
    } else if (typeof value === "object" && typeof oldValue === "object") {
        return value["@id"] !== oldValue["@id"]
    } else return true
}
