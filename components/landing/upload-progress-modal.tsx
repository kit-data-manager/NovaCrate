import React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Error } from "../error"

// TODO prevent closing? What happens in case of error?

export function UploadProgressModal({
    open,
    onOpenChange,
    currentProgress,
    maxProgress,
    errors
}: {
    open: boolean
    onOpenChange: (isOpen: boolean) => void
    currentProgress: number
    maxProgress: number
    errors: string[]
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
                {errors.map((error, i) => (
                    <Error key={i} text={error} />
                ))}
            </DialogContent>
        </Dialog>
    )
}
