import { Dialog, DialogContent } from "@/components/ui/dialog"
import { SlimClass } from "@/lib/crate-verify/helpers"
import React, { useCallback, useContext, useEffect, useState } from "react"
import { AutoReference } from "@/components/global-modals-provider"
import { useEditorState } from "@/components/editor-state"
import { TypeSelect } from "@/components/create-entity/type-select"
import { CreateEntity } from "@/components/create-entity/create-entity"
import { EntityEditorTabsContext } from "@/components/entity-tabs-provider"
import { SimpleTypeSelect } from "@/components/create-entity/simple-type-select"

export function CreateEntityModal({
    open,
    onEntityCreated,
    onOpenChange,
    restrictToClasses,
    autoReference,
    forceId,
    basePath
}: {
    open: boolean
    onEntityCreated: (entity: IFlatEntity) => void
    onOpenChange: (open: boolean) => void
    restrictToClasses?: SlimClass[]
    autoReference?: AutoReference
    forceId?: string
    basePath?: string
}) {
    const addEntity = useEditorState.useAddEntity()
    const { focusTab } = useContext(EntityEditorTabsContext)

    const [fullTypeBrowser, setFullTypeBrowser] = useState(!!forceId || !!restrictToClasses)
    const [selectedType, setSelectedType] = useState("")

    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setSelectedType("")
                setFullTypeBrowser(false)
            }, 1000)
        } else {
            setFullTypeBrowser(!!forceId || !!restrictToClasses)
        }
    }, [forceId, open, restrictToClasses])

    const onTypeSelect = useCallback((value: string) => {
        setSelectedType(value)
    }, [])

    const onCreate = useCallback(
        (id: string, name: string) => {
            const newEntity = addEntity(
                id,
                [selectedType],
                {
                    name
                },
                autoReference
            )
            if (newEntity) {
                onEntityCreated(newEntity)
                focusTab(id)
            }
        },
        [addEntity, autoReference, focusTab, onEntityCreated, selectedType]
    )

    const backToTypeSelect = useCallback(() => {
        setSelectedType("")
    }, [])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={
                    "transition-none " + (!selectedType && !fullTypeBrowser ? "max-w-[1000px]" : "")
                }
            >
                {!selectedType ? (
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
                        />
                    )
                ) : (
                    <CreateEntity
                        onBackClick={backToTypeSelect}
                        onCreateClick={onCreate}
                        forceId={forceId}
                        selectedType={selectedType}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}
