import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SlimClass } from "@/lib/crate-verify/helpers"
import React, { useCallback, useContext, useMemo, useState } from "react"
import { AutoReference } from "@/components/global-modals-provider"
import { useEditorState } from "@/components/editor-state"
import { TypeSelect } from "@/components/create-entity/type-select"
import { CreateEntity } from "@/components/create-entity/create-entity"
import { EntityEditorTabsContext } from "@/components/entity-tabs-provider"
import { RO_CRATE_DATASET, RO_CRATE_FILE } from "@/lib/constants"

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
    const { focusTab } = useContext(EntityEditorTabsContext)

    const [selectedType, setSelectedType] = useState("")

    const onTypeSelect = useCallback((value: string) => {
        setSelectedType(value)
    }, [])

    const localOnOpenChange = useCallback(
        (isOpen: boolean) => {
            setSelectedType("")
            onOpenChange(isOpen)
        },
        [onOpenChange]
    )

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
                setSelectedType("")
                console.log(id)
                focusTab(id)
            }
        },
        [addEntity, autoReference, focusTab, onEntityCreated, selectedType]
    )

    const creatingContextual = useMemo(() => {
        return selectedType !== "Dataset" && selectedType !== "File"
    }, [])

    const backToTypeSelect = useCallback(() => {
        setSelectedType("")
    }, [])

    return (
        <Dialog open={open} onOpenChange={localOnOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {selectedType
                            ? `Create new ${selectedType} Entity`
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
                        creatingContextual={creatingContextual}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}
