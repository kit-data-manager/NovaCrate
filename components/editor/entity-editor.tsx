"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { PropertyEditor } from "@/components/editor/property-editor"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, Save } from "lucide-react"

type PropertyHasChangesEnum = "no" | "hasChanges" | "isNew"

export interface EntityEditorProperty {
    propertyName: string
    values: FlatEntitySinglePropertyTypes[]
}

function mapEntityToProperties(data: IFlatEntity): EntityEditorProperty[] {
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
}

export function headline(entityData: IFlatEntity) {
    const defaultHeadline = entityData["@type"] + " " + entityData["@id"]

    if (entityData["@type"] === "Person") {
        const parts: string[] = []

        const autoPush = (value: unknown) => {
            if (value) {
                if (Array.isArray(value)) {
                    parts.push(...value)
                } else {
                    parts.push(value + "")
                }
            }
        }

        autoPush(entityData.givenName)
        autoPush(entityData.additionalName)
        autoPush(entityData.familyName)

        return parts.length > 0 ? parts.join(" ") : defaultHeadline
    }
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

    const hasUnsavedChanges = useMemo(() => {
        return propertyHasChanges.filter((p) => p !== "no").length > 0
    }, [propertyHasChanges])

    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault()
            return "There are unsaved changes."
        }

        if (hasUnsavedChanges) {
            window.addEventListener("beforeunload", handler)
        }

        return () => {
            if (hasUnsavedChanges) {
                window.removeEventListener("beforeunload", handler)
            }
        }
    }, [hasUnsavedChanges])

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
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold flex items-end">{headline(entityData)}</h2>

                <div className="flex items-center mr-4">
                    <Switch id="easy-mode" />
                    <Label className="p-2" htmlFor="easy-mode">
                        Easy Mode
                    </Label>
                </div>
            </div>

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

            <div className="flex justify-between mt-6">
                <Button variant="secondary">
                    <Plus className={"w-4 h-4 mr-2"} /> Add Property
                </Button>
                <div className="flex gap-4 text-muted-foreground items-center">
                    {hasUnsavedChanges ? "There are unsaved changes" : null}
                    <Button>
                        <Save className={"w-4 h-4 mr-2"} /> Save
                    </Button>
                </div>
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
