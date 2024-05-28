import React, { useCallback, useContext, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trash } from "lucide-react"
import { useEditorState } from "@/lib/state/editor-state"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { getEntityDisplayName } from "@/lib/utils"
import { Error } from "@/components/error"
import { RO_CRATE_FILE } from "@/lib/constants"

// TODO: How to handle data files?

export function DeleteEntityModal({
    open,
    onOpenChange,
    entityId
}: {
    open: boolean
    onOpenChange: (isOpen: boolean) => void
    entityId: string
}) {
    const entity = useEditorState((store) => store.entities.get(entityId))
    const context = useEditorState.useCrateContext()
    const { deleteEntity, serviceProvider, crateId } = useContext(CrateDataContext)
    const removeEntity = useEditorState.useRemoveEntity()
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<unknown>()

    const localOnOpenChange = useCallback(
        (isOpen: boolean) => {
            if (!isDeleting) onOpenChange(isOpen)
        },
        [isDeleting, onOpenChange]
    )

    const onDeleteEntityClick = useCallback(() => {
        if (entity) {
            onOpenChange(false)
            setIsDeleting(true)
            deleteEntity(entity)
                .then(() => {
                    setDeleteError(undefined)
                    removeEntity(entity["@id"])
                })
                .catch((e) => {
                    console.error(e)
                    setDeleteError(e)
                })
                .finally(() => {
                    setIsDeleting(false)
                })
        } else if (serviceProvider && crateId) {
            // Attempt to delete anyway. The user has able to access the delete button, so there must be something here...
            // Assumes the type to be a file, since files can exist without having an entity
            onOpenChange(false)
            setIsDeleting(true)
            serviceProvider
                .deleteEntity(crateId, {
                    "@id": entityId,
                    "@type": [context.reverse(RO_CRATE_FILE) || RO_CRATE_FILE]
                })
                .then(() => {
                    setDeleteError(undefined)
                })
                .catch((e) => {
                    console.error(e)
                    setDeleteError(e)
                })
                .finally(() => {
                    setIsDeleting(false)
                })
        }
    }, [
        entity,
        serviceProvider,
        crateId,
        onOpenChange,
        deleteEntity,
        removeEntity,
        entityId,
        context
    ])

    const onCloseClick = useCallback(() => {
        onOpenChange(false)
    }, [onOpenChange])

    return (
        <Dialog open={open} onOpenChange={localOnOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                </DialogHeader>

                <Error title="An error occured while deleting this entity" error={deleteError} />
                <div>
                    Are you sure that you want to delete{" "}
                    {entity ? getEntityDisplayName(entity) : <i>Unresolved Entity</i>}? The
                    associated data will be <b>permanently deleted</b>. This action is not
                    reversible.
                </div>
                <div className="flex justify-between">
                    <Button variant="outline" onClick={onCloseClick} disabled={isDeleting}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onDeleteEntityClick}
                        disabled={isDeleting}
                    >
                        <Trash className="w-4 h-4 mr-2" /> Delete
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
