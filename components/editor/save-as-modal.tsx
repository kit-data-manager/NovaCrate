import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CreateEntity } from "@/components/create-entity/create-entity"
import { getEntityDisplayName, toArray } from "@/lib/utils"
import { useCallback, useContext } from "react"
import { useEditorState } from "@/components/editor-state"
import { EntityEditorTabsContext } from "@/components/entity-tabs-provider"

export function SaveAsModal({
    open,
    onOpenChange,
    entity
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    entity?: IFlatEntity
}) {
    const addEntity = useEditorState.useAddEntity()
    const { focusTab } = useContext(EntityEditorTabsContext)

    const onCreate = useCallback(
        (id: string, name: string) => {
            if (
                entity &&
                addEntity(id, toArray(entity["@type"]), {
                    ...entity,
                    name
                })
            ) {
                onOpenChange(false)
                focusTab(id)
            }
        },
        [addEntity, entity, focusTab, onOpenChange]
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Save as...</DialogTitle>
                </DialogHeader>

                <CreateEntity
                    onBackClick={() => {
                        onOpenChange(false)
                    }}
                    onCreateClick={onCreate}
                    defaultName={entity ? getEntityDisplayName(entity) + " Copy" : undefined}
                />
            </DialogContent>
        </Dialog>
    )
}
