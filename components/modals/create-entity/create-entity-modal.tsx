import { Dialog, DialogContent } from "@/components/ui/dialog"
import { SlimClass } from "@/lib/schema-worker/helpers"
import React, { useCallback, useEffect, useState } from "react"
import { useEditorState } from "@/lib/state/editor-state"
import { TypeSelect } from "@/components/modals/create-entity/type-select"
import { CreateEntity } from "@/components/modals/create-entity/create-entity"
import { useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"
import { SimpleTypeSelect } from "@/components/modals/create-entity/simple-type-select"
import { UploadProgress } from "@/components/modals/create-entity/upload-progress"
import { AutoReference, toArray } from "@/lib/utils"
import { CreateProviders } from "@/components/modals/create-entity/create-providers"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { useCreateEntityUpload } from "@/components/modals/create-entity/hooks/use-create-entity-upload"

export function CreateEntityModal({
    open,
    onOpenChange,
    restrictToClasses,
    autoReference,
    forceId,
    basePath
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    restrictToClasses?: SlimClass[]
    autoReference?: AutoReference
    forceId?: string
    basePath?: string
}) {
    const addEntity = useEditorState((store) => store.addEntity)
    const focusTab = useEntityEditorTabs((store) => store.focusTab)
    const openTab = useEntityEditorTabs((store) => store.openTab)

    /**
     * Expected to be a shortened type when possible.
     */
    const [selectedType, setSelectedType] = useState<string | string[]>("")
    /**
     * Set when the entity to be created comes from a profile
     */
    const [selectedEntityRule, setSelectedEntityRule] = useState<EntityRule | undefined>()

    const [fullTypeBrowser, setFullTypeBrowser] = useState(false)

    const {
        uploading,
        currentUploadProgress,
        maxUploadProgress,
        uploadErrors,
        resetUploadState,
        onUploadFile,
        onUploadFolder
    } = useCreateEntityUpload({
        selectedType,
        openTab,
        onClose: useCallback(() => onOpenChange(false), [onOpenChange])
    })

    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setSelectedType("")
                setSelectedEntityRule(undefined)
                setFullTypeBrowser(false)
                resetUploadState()
            }, 200)
        }
    }, [forceId, open, resetUploadState, restrictToClasses])

    const onTypeSelect = useCallback((value: string | string[], profileClass?: EntityRule) => {
        setSelectedType(value)
        setSelectedEntityRule(profileClass)
    }, [])

    const onEntityCreated = useCallback(() => {
        onOpenChange(false)
    }, [onOpenChange])

    const onCreate = useCallback(
        (id: string, name: string) => {
            const newEntity = addEntity(
                id,
                toArray(selectedType),
                {
                    name
                },
                autoReference
            )
            if (newEntity) {
                // TODO add mandatory properties to make the validator pick the entity up correctly when it was created from a profile
                onEntityCreated()
                focusTab(id)
            }
        },
        [addEntity, autoReference, focusTab, onEntityCreated, selectedType]
    )

    const onProviderCreate = useCallback(
        (entityOrId: IEntity | string) => {
            onEntityCreated()
            if (typeof entityOrId === "string") {
                openTab({ entityId: entityOrId }, true)
            } else {
                focusTab(entityOrId["@id"])
            }
        },
        [focusTab, onEntityCreated, openTab]
    )

    const backToTypeSelect = useCallback(() => {
        setSelectedType("")
        setSelectedEntityRule(undefined)
    }, [])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={
                    "transition-none " + (!selectedType && !fullTypeBrowser ? "max-w-250!" : "")
                }
            >
                {uploading ? (
                    <UploadProgress
                        current={currentUploadProgress}
                        max={maxUploadProgress}
                        errors={uploadErrors}
                    />
                ) : !selectedType ? (
                    fullTypeBrowser ? (
                        <TypeSelect
                            open={open}
                            restrictToClasses={restrictToClasses}
                            onTypeSelect={onTypeSelect}
                            setFullTypeBrowser={setFullTypeBrowser}
                        />
                    ) : (
                        <SimpleTypeSelect
                            onTypeSelect={onTypeSelect}
                            onOpenChange={onOpenChange}
                            setFullTypeBrowser={setFullTypeBrowser}
                            restrictToClasses={restrictToClasses}
                        />
                    )
                ) : (
                    <CreateProviders
                        selectedType={selectedType}
                        backToTypeSelect={backToTypeSelect}
                        onProviderCreate={onProviderCreate}
                        autoReference={autoReference}
                        fallback={
                            <CreateEntity
                                onBackClick={backToTypeSelect}
                                onCreateClick={onCreate}
                                forceId={forceId}
                                selectedType={selectedType}
                                basePath={basePath}
                                onUploadFile={onUploadFile}
                                onUploadFolder={onUploadFolder}
                                entityRule={selectedEntityRule}
                            />
                        }
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}
