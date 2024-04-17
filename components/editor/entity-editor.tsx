"use client"

import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { PropertyEditor } from "@/components/editor/property-editor"
import { Button } from "@/components/ui/button"
import {
    EllipsisVertical,
    PanelLeftClose,
    Plus,
    RefreshCw,
    Save,
    Search,
    Trash,
    Undo2
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
    getEntityDisplayName,
    isRootEntity as isRootEntityUtil,
    isDataEntity as isDataEntityUtil
} from "@/lib/utils"
import { WebWorkerWarning } from "@/components/web-worker-warning"
import { EntityEditorTabsContext } from "@/components/entity-tabs-provider"
import { CrateDataContext } from "@/components/crate-data-provider"
import { Error } from "@/components/error"

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

function mapPropertiesToEntity(data: EntityEditorProperty[]): IFlatEntity {
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
    if (b.propertyName === "name" && !b.propertyName.startsWith("@")) return 1
    if (a.propertyName === b.propertyName) return 0
    return a.propertyName > b.propertyName ? 1 : -1
}

export function EntityEditor({
    entityData,
    modifiedEntityData,
    dirty
}: {
    entityData: IFlatEntity
    modifiedEntityData: IFlatEntity
    dirty: boolean
}) {
    const { updateTab } = useContext(EntityEditorTabsContext)
    const { updateEntity } = useContext(CrateDataContext)

    const [saveError, setSaveError] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    const initialProperties = useMemo(() => {
        return mapEntityToProperties(entityData)
    }, [entityData])

    const properties = useMemo(() => {
        return mapEntityToProperties(modifiedEntityData)
    }, [modifiedEntityData])

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
                modifiedEntity: mapPropertiesToEntity(modifiedProperties)
            })
        },
        [entityData, updateTab]
    )

    const modifyProperty = useCallback(
        (propertyName: string, value: FlatEntitySinglePropertyTypes, valueIdx: number) => {
            const propertyIndex = properties.findIndex((p) => p.propertyName === propertyName)
            if (propertyIndex < 0 || propertyIndex >= properties.length) return
            const property = properties[propertyIndex]
            if (!hasChanged(value, property.values[valueIdx])) return

            property.propertyName = propertyName
            property.values[valueIdx] = value
            modifyProperties(properties)
        },
        [modifyProperties, properties]
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
            modifyProperties(properties)
        },
        [modifyProperties, properties]
    )

    const addProperty = useCallback(
        (propertyName: string, values: FlatEntitySinglePropertyTypes[]) => {
            properties.push({
                propertyName,
                values
            })
            modifyProperties(properties)
        },
        [modifyProperties, properties]
    )

    const saveChanges = useCallback(() => {
        if (!hasUnsavedChanges) return

        setIsSaving(true)
        updateEntity(modifiedEntityData)
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
    }, [hasUnsavedChanges, modifiedEntityData, updateEntity])

    const isRootEntity = useMemo(() => {
        return isRootEntityUtil(entityData)
    }, [entityData])

    const isDataEntity = useMemo(() => {
        return isDataEntityUtil(entityData)
    }, [entityData])

    return (
        <div className="relative">
            <div className="flex mb-2 gap-2 sticky top-0 z-10 p-2 bg-accent">
                <Button size="sm" variant="outline" className="text-xs">
                    <PanelLeftClose className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="text-xs">
                    <Plus className={"w-4 h-4 mr-1"} /> Add Property
                </Button>
                <Button size="sm" variant="outline" className="text-xs">
                    <Search className="w-4 h-4 mr-1" /> Find References
                </Button>
                <Button size="sm" variant="destructive" className="text-xs">
                    <Trash className="w-4 h-4 mr-1" /> Delete Entity
                </Button>
                <div className="grow"></div>
                <div className="flex gap-2 items-center text-sm">
                    {hasUnsavedChanges ? (
                        <div className="text-muted-foreground">There are unsaved changes</div>
                    ) : null}
                    <Button
                        size="sm"
                        variant={hasUnsavedChanges ? undefined : "outline"}
                        className="text-xs"
                        onClick={() => saveChanges()}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <RefreshCw className={"w-4 h-4 mr-2 animate-spin"} />
                        ) : (
                            <Save className={"w-4 h-4 mr-2"} />
                        )}{" "}
                        Save
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
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
                    {properties.sort(byPropertyName).map((property, i) => {
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
