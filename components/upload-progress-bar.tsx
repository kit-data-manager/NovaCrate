import { DialogDescription } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Error } from "@/components/error"
import React from "react"

export function UploadProgressBar({
    value,
    max,
    errors
}: {
    value: number
    max: number
    errors: unknown[]
}) {
    return (
        <>
            <div>
                Importing: {value}/{max || "?"}
            </div>
            <DialogDescription>Large files will take some time...</DialogDescription>
            <Progress value={value * (100 / max)} />
            {errors.map((error, i) => (
                <Error title="A file failed to import" key={i} error={error} />
            ))}
        </>
    )
}
