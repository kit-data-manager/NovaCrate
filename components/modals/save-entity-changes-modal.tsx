import React, { memo, useCallback, useContext, useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
import { useEditorState } from "@/lib/state/editor-state"
import { CrateDataContext } from "@/components/providers/crate-data-provider"

export const SaveEntityChangesModal = memo(function SaveEntityChangesModal(props: {
    open: boolean
    onOpenChange: (isOpen: boolean) => void
    entityId: string
}) {
    const [render, setRender] = useState(props.open)

    useEffect(() => {
        if (props.open) {
            setRender(true)
        } else {
            setTimeout(() => {
                setRender(false)
            }, 100)
        }
    }, [props.open])

    return render ? <SaveEntityChangesModalInner {...props} /> : null
})

function SaveEntityChangesModalInner({
    open,
    onOpenChange,
    entityId
}: {
    open: boolean
    onOpenChange: (isOpen: boolean) => void
    entityId: string
}) {
    const revertEntity = useEditorState.useRevertEntity()
    const entity = useEditorState((store) => store.entities.get(entityId))
    const { saveEntity } = useContext(CrateDataContext)

    const localOnOpenChange = useCallback(
        (isOpen: boolean) => {
            onOpenChange(isOpen)
        },
        [onOpenChange]
    )

    const onSaveEntityClick = useCallback(() => {
        if (entity) {
            onOpenChange(false)
            saveEntity(entity).catch(console.error)
        }
    }, [entity, saveEntity, onOpenChange])

    const onRevertEntityClick = useCallback(() => {
        revertEntity(entityId)
        onOpenChange(false)
    }, [entityId, onOpenChange, revertEntity])

    return (
        <Dialog open={open} onOpenChange={localOnOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Unsaved Changes</DialogTitle>
                </DialogHeader>

                <div>
                    There are unsaved changes in this tab. Please save your changes or revert them
                    before closing the tab.
                </div>
                <div className="flex justify-between">
                    <Button variant="outline" onClick={onRevertEntityClick}>
                        Revert Changes
                    </Button>
                    <Button onClick={onSaveEntityClick}>
                        <Save className="w-4 h-4 mr-2" /> Save
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
