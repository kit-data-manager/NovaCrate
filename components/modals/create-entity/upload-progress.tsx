import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import React from "react"
import { UploadProgressBar } from "@/components/upload-progress-bar"

export function UploadProgress({
    max,
    errors,
    current
}: {
    current: number
    max: number
    errors: unknown[]
}) {
    return (
        <div>
            <DialogHeader>
                <DialogTitle>Importing...</DialogTitle>

                <DialogDescription>Do not close or reload this page</DialogDescription>
            </DialogHeader>

            <UploadProgressBar value={current} max={max} errors={errors} />
        </div>
    )
}
