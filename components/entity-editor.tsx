"use client"

import { useCallback, useEffect, useState } from "react"
import { PropertyEditor } from "@/components/property-editor"

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
                arrValue = value
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

    const modifyProperty = useCallback(
        (propertyName: string, value: FlatEntitySinglePropertyTypes, valueIdx: number) => {
            const propertyIndex = properties.findIndex((p) => p.propertyName === propertyName)
            if (propertyIndex < 0 || propertyIndex >= properties.length) return
            const property = properties[propertyIndex]
            if (property.propertyName === propertyName && property.values[valueIdx] === value)
                return // TODO proper compare of references

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
                {properties.map((property) => {
                    return (
                        <div key={property.propertyName}>
                            <PropertyEditor property={property} onModifyProperty={modifyProperty} />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
