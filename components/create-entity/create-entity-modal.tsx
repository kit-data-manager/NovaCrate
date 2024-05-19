import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SlimClass } from "@/lib/crate-verify/helpers"
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { AutoReference } from "@/components/global-modals-provider"
import { useEditorState } from "@/components/editor-state"
import { TypeSelect } from "@/components/create-entity/type-select"
import { CreateEntity } from "@/components/create-entity/create-entity"
import { EntityEditorTabsContext } from "@/components/entity-tabs-provider"
import { RO_CRATE_DATASET, RO_CRATE_FILE } from "@/lib/constants"
import { camelCaseReadable } from "@/lib/utils"

export function CreateEntityModal({
    open,
    onEntityCreated,
    onOpenChange,
    restrictToClasses,
    autoReference,
    forceId
}: {
    open: boolean
    onEntityCreated: () => void
    onOpenChange: (open: boolean) => void
    restrictToClasses?: SlimClass[]
    autoReference?: AutoReference
    forceId?: string
}) {
    const addEntity = useEditorState.useAddEntity()
    const context = useEditorState.useCrateContext()
    const { focusTab } = useContext(EntityEditorTabsContext)

    const [selectedType, setSelectedType] = useState("")

    useEffect(() => {
        if (!open) {
            setSelectedType("")
        }
    }, [open])

    const onTypeSelect = useCallback((value: string) => {
        setSelectedType(value)
    }, [])

    const onCreate = useCallback(
        (id: string, name: string) => {
            if (
                addEntity(
                    id,
                    [selectedType],
                    {
                        name
                    },
                    autoReference
                )
            ) {
                onEntityCreated()
                focusTab(id)
            }
        },
        [addEntity, autoReference, focusTab, onEntityCreated, selectedType]
    )

    const fileUpload = useMemo(() => {
        return context.resolve(selectedType) === RO_CRATE_FILE
    }, [context, selectedType])

    const folderUpload = useMemo(() => {
        return context.resolve(selectedType) === RO_CRATE_DATASET
    }, [context, selectedType])

    const backToTypeSelect = useCallback(() => {
        setSelectedType("")
    }, [])

    const defaultName = useMemo(() => {
        if ((fileUpload || folderUpload) && forceId) {
            const split = forceId.split("/").filter((part) => !!part)
            return split[split.length - 1]
        } else return undefined
    }, [fileUpload, folderUpload, forceId])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {selectedType
                            ? `Create new ${camelCaseReadable(selectedType)} Entity`
                            : "Select Type of new Entity"}
                    </DialogTitle>
                </DialogHeader>

                {!selectedType ? (
                    <TypeSelect
                        open={open}
                        restrictToClasses={restrictToClasses}
                        onTypeSelect={onTypeSelect}
                    />
                ) : (
                    <CreateEntity
                        onBackClick={backToTypeSelect}
                        onCreateClick={onCreate}
                        forceId={forceId}
                        fileUpload={fileUpload}
                        folderUpload={folderUpload}
                        defaultName={defaultName}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}
