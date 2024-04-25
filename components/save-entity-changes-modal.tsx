import React, { useCallback, useContext } from "react"
import { CrateEditorContext } from "@/components/crate-editor-provider"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"

export function SaveEntityChangesModal({
    open,
    onOpenChange,
    entityId
}: {
    open: boolean
    onOpenChange: (isOpen: boolean) => void
    entityId: string
}) {
    const { saveEntity, revertEntity } = useContext(CrateEditorContext)

    const localOnOpenChange = useCallback(
        (isOpen: boolean) => {
            onOpenChange(isOpen)
        },
        [onOpenChange]
    )

    const onSaveEntityClick = useCallback(() => {
        saveEntity(entityId)
        onOpenChange(false)
    }, [saveEntity, entityId, onOpenChange])

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

                <div>Please save your changes or revert them before closing this tab</div>
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
