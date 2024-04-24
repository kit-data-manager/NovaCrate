"use client"

import { useCallback, useContext, useMemo, useState } from "react"
import {
    mapEntityToProperties,
    PropertyEditor,
    PropertyEditorTypes
} from "@/components/editor/property-editor"
import {
    getEntityDisplayName,
    isDataEntity as isDataEntityUtil,
    isRootEntity as isRootEntityUtil,
    toArray
} from "@/lib/utils"
import { WebWorkerWarning } from "@/components/web-worker-warning"
import { CrateDataContext, TEST_CONTEXT } from "@/components/crate-data-provider"
import { Error } from "@/components/error"
import { EntityEditorHeader } from "@/components/editor/entity-editor-header"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAsync } from "@/components/use-async"
import { CrateVerifyContext } from "@/components/crate-verify-provider"
import { AddPropertyModal, PossibleProperty } from "@/components/editor/add-property-modal"
import { CrateEditorContext, Diff } from "@/components/crate-editor-provider"

export function EntityEditor({ entityId }: { entityId: string }) {
    const { crateData } = useContext(CrateDataContext)
    const {
        entities,
        entitiesChangelist,
        isSaving,
        saveError,
        saveEntity,
        addProperty,
        addPropertyEntry,
        modifyPropertyEntry,
        removePropertyEntry,
        revertEntity
    } = useContext(CrateEditorContext)
    const { isReady: crateVerifyReady, getClassProperties } = useContext(CrateVerifyContext)

    const entity = useMemo(() => {
        return entities.find((e) => e["@id"] === entityId)
    }, [entities, entityId])

    const originalEntity = useMemo(() => {
        return crateData?.["@graph"].find((e) => e["@id"] === entityId)
    }, [crateData, entityId])

    const [addPropertyModelOpen, setAddPropertyModelOpen] = useState(false)

    const addPropertyModelOpenChange = useCallback((isOpen: boolean) => {
        setAddPropertyModelOpen(isOpen)
    }, [])

    const openAddPropertyModal = useCallback(() => {
        setAddPropertyModelOpen(true)
    }, [])

    const possiblePropertiesResolver = useCallback(
        async (types: string[]) => {
            if (crateVerifyReady) {
                const resolved = types
                    .map((type) => TEST_CONTEXT.resolve(type))
                    .filter((s) => typeof s === "string") as string[]
                const data = await getClassProperties(resolved)
                return data
                    .map((s) => {
                        return {
                            ...s,
                            range: s.range.map((r) => r["@id"]),
                            rangeReadable: s.range
                                .map((r) => r["@id"])
                                .map((r) => TEST_CONTEXT.reverse(r))
                                .filter((r) => typeof r === "string"),
                            propertyName: TEST_CONTEXT.reverse(s["@id"])
                        }
                    })
                    .filter((s) => typeof s.propertyName === "string") as PossibleProperty[]
            }
        },
        [crateVerifyReady, getClassProperties]
    )

    const typeArray = useMemo(() => {
        if (!entity) return []
        return toArray(entity["@type"])
    }, [entity])

    const {
        data: possibleProperties,
        error: possiblePropertiesError,
        isPending: possiblePropertiesPending
    } = useAsync(crateVerifyReady ? typeArray : null, possiblePropertiesResolver)

    const isRootEntity = useMemo(() => {
        if (!entity) return false
        return isRootEntityUtil(entity)
    }, [entity])

    const isDataEntity = useMemo(() => {
        if (!entity) return false
        return isDataEntityUtil(entity)
    }, [entity])

    const hasUnsavedChanges = useMemo(() => {
        const diff = entitiesChangelist.get(entityId)
        return !!diff
    }, [entitiesChangelist, entityId])

    const onPropertyAdd = useCallback(
        (propertyName: string, value?: FlatEntityPropertyTypes) => {
            addProperty(entityId, propertyName, value)
        },
        [addProperty, entityId]
    )

    const onPropertyAddEntry = useCallback(
        (propertyName: string, type: PropertyEditorTypes) => {
            addPropertyEntry(entityId, propertyName, type)
        },
        [addPropertyEntry, entityId]
    )

    const onModifyPropertyEntry = useCallback(
        (propertyName: string, valueIdx: number, value: FlatEntitySinglePropertyTypes) => {
            modifyPropertyEntry(entityId, propertyName, valueIdx, value)
        },
        [entityId, modifyPropertyEntry]
    )

    const onRemovePropertyEntry = useCallback(
        (propertyName: string, valueIdx: number) => {
            removePropertyEntry(entityId, propertyName, valueIdx)
        },
        [entityId, removePropertyEntry]
    )

    const onSave = useCallback(() => {
        saveEntity(entityId)
    }, [entityId, saveEntity])

    const onRevert = useCallback(() => {
        revertEntity(entityId)
    }, [entityId, revertEntity])

    const properties = useMemo(() => {
        if (!entity) return []
        return mapEntityToProperties(entity)
    }, [entity])

    const propertiesChangelist = useMemo(() => {
        return properties.map((property) => {
            if (!originalEntity) return Diff.New
            if (property.propertyName in originalEntity) {
                const prop = originalEntity[property.propertyName]
                return propertyHasChanged(property.values, prop) ? Diff.Changed : Diff.None
            } else {
                return Diff.New
            }
        })
    }, [originalEntity, properties])

    const displayName = useMemo(() => {
        return entity ? getEntityDisplayName(entity) : ""
    }, [entity])

    return (
        <div className="relative">
            <AddPropertyModal
                open={addPropertyModelOpen}
                onPropertyAdd={onPropertyAdd}
                onOpenChange={addPropertyModelOpenChange}
                possibleProperties={possibleProperties}
                possiblePropertiesPending={possiblePropertiesPending}
            />

            <EntityEditorHeader
                hasUnsavedChanges={hasUnsavedChanges}
                isSaving={isSaving}
                onSave={onSave}
                onRevert={onRevert}
            />

            <div className="p-4 mr-10">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold flex items-center">
                        {displayName}

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
                <Error
                    className="mt-4"
                    text={
                        possiblePropertiesError
                            ? "Error while determining properties: " + possiblePropertiesError
                            : ""
                    }
                />

                <div className="my-12 flex flex-col gap-10 mr-2">
                    {properties.map((property, i) => {
                        return (
                            <div key={property.propertyName}>
                                <PropertyEditor
                                    property={property}
                                    onModifyPropertyEntry={onModifyPropertyEntry}
                                    onAddPropertyEntry={onPropertyAddEntry}
                                    hasChanges={propertiesChangelist[i] === Diff.Changed}
                                    isNew={propertiesChangelist[i] === Diff.New}
                                    onRemovePropertyEntry={onRemovePropertyEntry}
                                />
                            </div>
                        )
                    })}
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={openAddPropertyModal}
                    >
                        <Plus className={"w-4 h-4 mr-1"} /> Add Property
                    </Button>
                </div>
            </div>
        </div>
    )
}

function propertyHasChanged(_value: FlatEntityPropertyTypes, _oldValue: FlatEntityPropertyTypes) {
    const value = toArray(_value)
    const oldValue = toArray(_oldValue)

    if (value.length !== oldValue.length) return true

    function singleValueChanged(
        a: FlatEntitySinglePropertyTypes,
        b: FlatEntitySinglePropertyTypes
    ) {
        if (typeof a !== typeof b) {
            return true
        } else if (typeof a === "string" && typeof b === "string") {
            return a !== b
        } else if (typeof a === "object" && typeof b === "object") {
            return a["@id"] !== b["@id"]
        }
        return false
    }

    return value.filter((v, i) => !singleValueChanged(v, oldValue[i])).length === 0
}
