"use client"

import { useCallback, useContext, useMemo, useRef, useState } from "react"
import { PropertyEditor } from "@/components/editor/property-editor"
import {
    Diff,
    getEntityDisplayName,
    isDataEntity as isDataEntityUtil,
    propertyHasChanged,
    canHavePreview as canHavePreviewUtil
} from "@/lib/utils"
import { WebWorkerWarning } from "@/components/web-worker-warning"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { Error } from "@/components/error"
import { EntityEditorHeader } from "@/components/editor/entity-editor-header"
import { useEditorState } from "@/lib/state/editor-state"
import { Skeleton } from "@/components/ui/skeleton"
import { InternalEntityHint } from "@/components/editor/hints/internal-entity-hint"
import { ActionButton } from "@/components/actions/action-buttons"
import { useGoToFileExplorer, useGoToGraph } from "@/lib/hooks"
import { EntityBadge } from "../entity/entity-badge"
import { useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"
import { useShallow } from "zustand/react/shallow"
import { TypeSelectModal } from "@/components/modals/type-select-modal"
import { ValidationOverview } from "@/components/editor/validation/validation-overview"
import { EntityEditorProperty, mapEntityToProperties, PropertyType } from "@/lib/property"

export function EntityEditor({
    entityId,
    toggleEntityBrowserPanel
}: {
    entityId: string
    toggleEntityBrowserPanel(): void
}) {
    const { isSaving, saveError, clearSaveError } = useContext(CrateDataContext)
    const entity = useEditorState((store) => store.entities.get(entityId))
    const originalEntity = useEditorState((store) => store.initialEntities.get(entityId))
    const entitiesChangelist = useEditorState(useShallow((store) => store.getEntitiesChangelist()))
    const addPropertyEntry = useEditorState((store) => store.addPropertyEntry)
    const modifyPropertyEntry = useEditorState((store) => store.modifyPropertyEntry)
    const removePropertyEntry = useEditorState((store) => store.removePropertyEntry)
    const getRootEntityId = useEditorState((store) => store.getRootEntityId)
    const previewingFilePath = useEntityEditorTabs((store) => store.previewingFilePath)
    const setPreviewingFilePath = useEntityEditorTabs((store) => store.setPreviewingFilePath)

    // Type selection for @type fields
    const [typeSelectModalOpen, setTypeSelectModalOpen] = useState(false)

    const onTypeFieldTypeSelect = useCallback(
        (type: string) => {
            setTypeSelectModalOpen(false)
            addPropertyEntry(entityId, "@type", type)
        },
        [addPropertyEntry, entityId]
    )

    const isDataEntity = useMemo(() => {
        if (!entity) return false
        return isDataEntityUtil(entity)
    }, [entity])

    const canHavePreview = useMemo(() => {
        if (!entity) return false
        return canHavePreviewUtil(entity)
    }, [entity])

    const togglePreview = useCallback(() => {
        if (canHavePreview) {
            if (previewingFilePath === entityId) {
                setPreviewingFilePath("")
            } else {
                setPreviewingFilePath(entityId)
            }
        }
    }, [canHavePreview, entityId, previewingFilePath, setPreviewingFilePath])

    const showInGraph = useGoToGraph()

    const showInFileExplorer = useGoToFileExplorer(entity)

    const isBeingPreviewed = useMemo(() => {
        return previewingFilePath === entity?.["@id"]
    }, [entity, previewingFilePath])

    const hasUnsavedChanges = useMemo(() => {
        const diff = entitiesChangelist.get(entityId)
        return !!diff
    }, [entitiesChangelist, entityId])

    const onPropertyAddEntry = useCallback(
        (propertyName: string, type: PropertyType) => {
            if (propertyName === "@type") {
                setTypeSelectModalOpen(true)
            } else {
                addPropertyEntry(entityId, propertyName, type)
            }
        },
        [addPropertyEntry, entityId]
    )

    const onModifyPropertyEntry = useCallback(
        (propertyName: string, valueIdx: number, value: EntitySinglePropertyTypes) => {
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

    const prevProperties = useRef<Map<string, EntityEditorProperty>>(new Map())
    const properties = useMemo(() => {
        if (!entity) return []
        const result = mapEntityToProperties(entity, prevProperties.current, originalEntity).filter(
            (e) => e.propertyName !== "@reverse"
        )
        prevProperties.current = new Map(result.map((entry) => [entry.propertyName, entry]))
        return result
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

    const ownSaveError = useMemo(() => {
        if (saveError.has(entityId)) {
            return saveError.get(entityId)
        } else return undefined
    }, [entityId, saveError])

    const clearOwnSaveError = useCallback(() => {
        clearSaveError(entityId)
    }, [clearSaveError, entityId])

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
        <div className="w-full h-full flex flex-col">
            <TypeSelectModal
                onOpenChange={setTypeSelectModalOpen}
                open={typeSelectModalOpen}
                onTypeSelect={onTypeFieldTypeSelect}
            />

            <EntityEditorHeader
                hasUnsavedChanges={hasUnsavedChanges}
                isSaving={isSaving}
                canSaveAs={!isDataEntity}
                toggleEntityBrowserPanel={toggleEntityBrowserPanel}
                canHavePreview={canHavePreview}
                togglePreview={togglePreview}
                isBeingPreviewed={isBeingPreviewed}
                goToGraph={showInGraph}
                goToFileExplorer={canHavePreview ? showInFileExplorer : undefined}
            />

            <div className="pt-12 p-4 pr-10 overflow-y-auto max-w-full">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold flex items-center gap-4">
                        <EntityBadge entity={entity} size="lg" />
                        <span className="break-all">{displayName}</span>
                    </h2>
                    <div className="gap-2 flex entity-validation-overview">
                        <ValidationOverview entityId={entityId} />
                    </div>
                </div>

                <WebWorkerWarning />
                <InternalEntityHint entity={entity} />
                <Error
                    className="mt-4"
                    title="Error while saving"
                    error={ownSaveError}
                    onClear={clearOwnSaveError}
                />

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
                    <ActionButton
                        actionId={"entity.add-property"}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        noShortcut
                    />
                </div>
            </div>
        </div>
    )
}
