"use client"

import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import {
    mapEntityToProperties,
    PropertyEditor,
    PropertyEditorTypes
} from "@/components/editor/property-editor"
import {
    Diff,
    getEntityDisplayName,
    isDataEntity as isDataEntityUtil,
    isRootEntity as isRootEntityUtil,
    propertyHasChanged,
    toArray
} from "@/lib/utils"
import { WebWorkerWarning } from "@/components/web-worker-warning"
import { CrateDataContext } from "@/components/crate-data-provider"
import { Error } from "@/components/error"
import { EntityEditorHeader } from "@/components/editor/entity-editor-header"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAsync } from "@/components/use-async"
import { CrateVerifyContext } from "@/components/crate-verify-provider"
import { AddPropertyModal, PossibleProperty } from "@/components/editor/add-property-modal"
import { UnknownTypeWarning } from "@/components/editor/unknown-type-warning"
import { EntityEditorTabsContext } from "@/components/entity-tabs-provider"
import { useEditorState } from "@/components/editor-state"
import { GlobalModalContext } from "@/components/global-modals-provider"

export function EntityEditor({ entityId }: { entityId: string }) {
    const { saveEntity, isSaving, saveError } = useContext(CrateDataContext)
    const entity = useEditorState((store) => store.entities.get(entityId))
    const originalEntity = useEditorState((store) => store.initialEntities.get(entityId))
    const entitiesChangelist = useEditorState((store) => store.getEntitiesChangelist())
    const addProperty = useEditorState.useAddProperty()
    const addPropertyEntry = useEditorState.useAddPropertyEntry()
    const modifyPropertyEntry = useEditorState.useModifyPropertyEntry()
    const removePropertyEntry = useEditorState.useRemovePropertyEntry()
    const revertEntity = useEditorState.useRevertEntity()
    const crateContext = useEditorState.useCrateContext()

    const { isReady: crateVerifyReady, getClassProperties } = useContext(CrateVerifyContext)
    const { focusProperty } = useContext(EntityEditorTabsContext)
    const { showDeleteEntityModal } = useContext(GlobalModalContext)

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
                    .map((type) => crateContext.resolve(type))
                    .filter((s) => typeof s === "string") as string[]
                const data = await getClassProperties(resolved)
                return data
                    .map((s) => {
                        return {
                            ...s,
                            range: s.range.map((r) => r["@id"]),
                            rangeReadable: s.range
                                .map((r) => r["@id"])
                                .map((r) => crateContext.reverse(r))
                                .filter((r) => typeof r === "string"),
                            propertyName: crateContext.reverse(s["@id"])
                        }
                    })
                    .filter((s) => typeof s.propertyName === "string") as PossibleProperty[]
            }
        },
        [crateContext, crateVerifyReady, getClassProperties]
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
            focusProperty(entityId, propertyName)
        },
        [addProperty, entityId, focusProperty]
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
        if (entity) saveEntity(entity).then()
    }, [entity, saveEntity])

    const onRevert = useCallback(() => {
        revertEntity(entityId)
    }, [entityId, revertEntity])

    const onDelete = useCallback(() => {
        showDeleteEntityModal(entityId)
    }, [entityId, showDeleteEntityModal])

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

    useEffect(() => {
        function handler(e: KeyboardEvent) {
            if (e.getModifierState("Control") && e.key === "s") {
                e.stopPropagation()
                e.stopImmediatePropagation()
                e.preventDefault()
                onSave()
            }
        }

        window.addEventListener("keydown", handler)

        return () => window.removeEventListener("keydown", handler)
    }, [hasUnsavedChanges, onSave])

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
                onDelete={onDelete}
                openAddPropertyModal={openAddPropertyModal}
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
                <UnknownTypeWarning entityType={entity?.["@type"] || []} />
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

                <div className="my-12 flex flex-col gap-4 mr-2">
                    {properties.map((property, i) => {
                        return (
                            <div key={property.propertyName}>
                                <PropertyEditor
                                    entityId={entityId}
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
