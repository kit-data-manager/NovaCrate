import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CreateEntity } from "@/components/modals/create-entity/create-entity"
import { toArray } from "@/lib/utils"
import { useCallback, useContext } from "react"
import { useEditorState } from "@/lib/state/editor-state"
import { CrateDataContext } from "@/components/providers/crate-data-provider"

export function SaveAsModal({
    open,
    onOpenChange,
    entityId
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    entityId: string
}) {
    const addEntity = useEditorState.useAddEntity()
    const entity = useEditorState((store) => store.entities.get(entityId))
    const { saveEntity } = useContext(CrateDataContext)

    const onCreate = useCallback(
        (id: string, name: string) => {
            if (entity) {
                const result = addEntity(id, toArray(entity["@type"]), {
                    ...entity,
                    name
                })
                if (result) {
                    onOpenChange(false)
                    saveEntity(result).then()
                }
            }
        },
        [addEntity, entity, onOpenChange, saveEntity]
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
                    selectedType={entity?.["@type"][0] || ""}
                    onUploadFolder={() => {}}
                    onUploadFile={() => {}}
                />
            </DialogContent>
        </Dialog>
    )
}
