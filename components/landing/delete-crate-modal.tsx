import React, { useCallback, useContext, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trash } from "lucide-react"
import { CrateDataContext } from "@/components/crate-data-provider"
import { Error } from "@/components/error"

export function DeleteCrateModal({
    open,
    onOpenChange,
    onDeleted,
    crateId
}: {
    open: boolean
    onOpenChange: (isOpen: boolean) => void
    onDeleted(crateId: string): void
    crateId: string
}) {
    const { serviceProvider } = useContext(CrateDataContext)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<unknown>()

    const localOnOpenChange = useCallback(
        (isOpen: boolean) => {
            if (!isDeleting) onOpenChange(isOpen)
        },
        [isDeleting, onOpenChange]
    )

    const onDeleteCrateClick = useCallback(() => {
        if (serviceProvider) {
            setIsDeleting(true)
            serviceProvider
                .deleteCrate(crateId)
                .then(() => {
                    setDeleteError(undefined)
                    onDeleted(crateId)
                })
                .catch((e) => {
                    console.error(e)
                    setDeleteError(e)
                })
                .finally(() => {
                    setIsDeleting(false)
                })
        }
    }, [serviceProvider, crateId, onDeleted])

    const onCloseClick = useCallback(() => {
        onOpenChange(false)
    }, [onOpenChange])

    return (
        <Dialog open={open} onOpenChange={localOnOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                </DialogHeader>

                <Error title="An error occured while deleting this crate" error={deleteError} />
                <div>
                    Are you sure that you want to delete this crate? <b>All data</b> will be{" "}
                    <b>permanently deleted</b>.
                </div>
                <div className="flex justify-between">
                    <Button variant="outline" onClick={onCloseClick} disabled={isDeleting}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onDeleteCrateClick}
                        disabled={isDeleting}
                    >
                        <Trash className="w-4 h-4 mr-2" /> Delete
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
