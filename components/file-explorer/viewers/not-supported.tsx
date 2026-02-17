import { EyeOff } from "lucide-react"

export function PreviewNotSupported() {
    return (
        <div className="grow flex justify-center items-center">
            <div className="flex flex-col justify-center items-center p-10 text-center text-muted-foreground">
                <EyeOff className="w-20 h-20" />
                <div className="text-2xl py-4">Preview not available</div>
                <div>
                    There is no preview available for this file type. Download it to view it or
                    select a different file to preview.
                </div>
            </div>
        </div>
    )
}
