import React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"

// TODO prevent closing? What happens in case of error?

export function UploadProgressModal({
    open,
    onOpenChange,
    currentProgress,
    maxProgress
}: {
    open: boolean
    onOpenChange: (isOpen: boolean) => void
    currentProgress: number
    maxProgress: number
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Uploading...</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                    {currentProgress}/{maxProgress || "?"}
                </DialogDescription>
            </DialogContent>
        </Dialog>
    )
}
