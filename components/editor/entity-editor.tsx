"use client"

import { useCallback, useContext, useMemo } from "react"
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
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { Error } from "@/components/error"
import { EntityEditorHeader } from "@/components/editor/entity-editor-header"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UnknownTypeWarning } from "@/components/editor/unknown-type-warning"
import { EntityEditorTabsContext } from "@/components/providers/entity-tabs-provider"
import { useEditorState } from "@/lib/state/editor-state"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { RootEntityHint } from "@/components/editor/hints/root-entity-hint"
import { InternalEntityHint } from "@/components/editor/hints/internal-entity-hint"
import { DataEntityHint } from "@/components/editor/hints/data-entity-hint"
import { ContextualEntityHint } from "@/components/editor/hints/contextual-entity-hint"

export function EntityEditor({
    entityId,
    toggleEntityBrowserPanel
}: {
    entityId: string
    toggleEntityBrowserPanel(): void
}) {
    const { saveEntity, isSaving, saveError } = useContext(CrateDataContext)
    const entity = useEditorState((store) => store.entities.get(entityId))
    const originalEntity = useEditorState((store) => store.initialEntities.get(entityId))
    const entitiesChangelist = useEditorState((store) => store.getEntitiesChangelist())
    const addProperty = useEditorState.useAddProperty()
    const addPropertyEntry = useEditorState.useAddPropertyEntry()
    const modifyPropertyEntry = useEditorState.useModifyPropertyEntry()
    const removePropertyEntry = useEditorState.useRemovePropertyEntry()
    const revertEntity = useEditorState.useRevertEntity()

    const { focusProperty } = useContext(EntityEditorTabsContext)
    const {
        showDeleteEntityModal,
        showSaveAsModal,
        showFindReferencesModal,
        showAddPropertyModal
    } = useContext(GlobalModalContext)

    const typeArray = useMemo(() => {
        if (!entity) return []
        return toArray(entity["@type"])
    }, [entity])

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
        return mapEntityToProperties(entity, originalEntity)
    }, [entity, originalEntity])

    const propertiesChangelist = useMemo(() => {
        const changeMap: Map<string, Diff> = new Map()
        properties.map((property) => {
            if (!originalEntity) return changeMap.set(property.propertyName, Diff.New)
            if (property.propertyName in originalEntity) {
                const prop = originalEntity[property.propertyName]
                changeMap.set(
                    property.propertyName,
                    propertyHasChanged(property.values, prop) ? Diff.Changed : Diff.None
                )
            } else {
                changeMap.set(property.propertyName, Diff.New)
            }
        })
        return changeMap
    }, [originalEntity, properties])

    const displayName = useMemo(() => {
        return entity ? getEntityDisplayName(entity) : ""
    }, [entity])

    const openAddPropertyModal = useCallback(() => {
        showAddPropertyModal(typeArray, onPropertyAdd)
    }, [showAddPropertyModal, onPropertyAdd, typeArray])

    const openFindReferencesModal = useCallback(() => {
        showFindReferencesModal(entityId)
    }, [entityId, showFindReferencesModal])

    const openSaveAsModal = useCallback(() => {
        showSaveAsModal(entityId)
    }, [entityId, showSaveAsModal])

    if (!entity) {
        return (
            <div>
                <div className="flex mb-2 gap-2 p-2 bg-accent">
                    <Skeleton className="w-10 h-7 my-1 bg-muted-foreground/30" />
                    <Skeleton className="w-32 h-7 my-1 bg-muted-foreground/30" />
                    <Skeleton className="w-32 h-7 my-1 bg-muted-foreground/30" />
                    <div className="grow" />
                    <Skeleton className="w-32 h-7 my-1 bg-muted-foreground/30" />
                    <Skeleton className="w-10 h-7 my-1 bg-muted-foreground/30" />
                </div>

                <div className="p-4 flex flex-col gap-4">
                    <Skeleton className="h-10 w-52 mb-10 mt-4" />

                    {[0, 0, 0, 0, 0, 0].map((_, i) => (
                        <div key={i} className="grid grid-cols-2 mr-10">
                            <Skeleton className="h-6 w-52" />
                            <Skeleton className="h-6 w-full" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="relative">
            <EntityEditorHeader
                hasUnsavedChanges={hasUnsavedChanges}
                isSaving={isSaving}
                onSave={onSave}
                onRevert={onRevert}
                onDelete={onDelete}
                openAddPropertyModal={openAddPropertyModal}
                openFindReferencesModal={openFindReferencesModal}
                openSaveAsModal={isDataEntity ? undefined : openSaveAsModal}
                toggleEntityBrowserPanel={toggleEntityBrowserPanel}
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
                    </h2>
                </div>

                <WebWorkerWarning />
                <UnknownTypeWarning entityType={entity?.["@type"] || []} />
                <RootEntityHint entity={entity} />
                <InternalEntityHint entity={entity} />
                <DataEntityHint entity={entity} />
                <ContextualEntityHint entity={entity} />
                <Error className="mt-4" title="Error while saving" error={saveError} />

                <div className="my-12 flex flex-col gap-4 mr-2">
                    {properties.map((property) => {
                        return (
                            <div key={property.propertyName}>
                                <PropertyEditor
                                    entityId={entityId}
                                    property={property}
                                    onModifyPropertyEntry={onModifyPropertyEntry}
                                    onAddPropertyEntry={onPropertyAddEntry}
                                    hasChanges={
                                        propertiesChangelist.get(property.propertyName) ===
                                        Diff.Changed
                                    }
                                    isNew={
                                        propertiesChangelist.get(property.propertyName) === Diff.New
                                    }
                                    isDeleted={property.deleted}
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
