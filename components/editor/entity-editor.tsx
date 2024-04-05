"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { PropertyEditor } from "@/components/editor/property-editor"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
    Check,
    EllipsisVertical,
    PanelLeftClose,
    Plus,
    Save,
    Search,
    Trash,
    Undo2
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

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

function headline(entityData: IFlatEntity) {
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
        <div className="relative">
            <div className="flex mb-2 gap-2 sticky top-0 z-10 p-2 bg-primary-foreground">
                <Button size="sm" variant="secondary" className="text-xs">
                    <PanelLeftClose className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="secondary" className="text-xs">
                    <Plus className={"w-4 h-4 mr-1"} /> Add Property
                </Button>
                <Button size="sm" variant="secondary" className="text-xs">
                    <Search className="w-4 h-4 mr-1" /> Find References
                </Button>
                <Button size="sm" variant="destructive" className="text-xs">
                    <Trash className="w-4 h-4 mr-1" /> Delete Entity
                </Button>
                <div className="grow"></div>
                <div className="flex gap-2 text-muted-foreground items-center text-sm">
                    {hasUnsavedChanges ? "There are unsaved changes" : null}
                    <Button
                        size="sm"
                        variant={hasUnsavedChanges ? undefined : "secondary"}
                        className="text-xs"
                    >
                        <Save className={"w-4 h-4 mr-2"} /> Save
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="sm">
                                <EllipsisVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem>
                                <Save className="w-4 h-4 mr-2" /> Save as...
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Undo2 className="w-4 h-4 mr-2" /> Revert Changes
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="p-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold flex items-center">
                        {headline(entityData)}

                        <div className="border-pink-600 border text-pink-600 px-1.5 rounded ml-6 text-sm">
                            Contextual
                        </div>
                        <div className="border-success border text-success px-1.5 rounded ml-2 text-sm flex gap-1 items-center">
                            <Check className="w-4 h-4" /> ORCID
                        </div>
                    </h2>

                    <div className="flex items-center mr-2">
                        <Switch id="easy-mode" />
                        <Label className="p-2" htmlFor="easy-mode">
                            Easy Mode
                        </Label>
                    </div>
                </div>

                <div className="my-12 flex flex-col gap-10 mr-2">
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
