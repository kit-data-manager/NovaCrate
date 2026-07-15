import { useEffect, useState } from "react"
import { InfoIcon } from "lucide-react"
import { ViewerProps } from "@/lib/file-preview"

export function IFrameViewer(props: ViewerProps) {
    const [url, setUrl] = useState<string>()

    useEffect(() => {
        if (!props.data) {
            setUrl(undefined)
            return
        }
        const newUrl = URL.createObjectURL(props.data)
        setUrl(newUrl)

        return () => URL.revokeObjectURL(newUrl)
    }, [props.data])

    if (!props.data) return null

    return (
        <div className="flex flex-col h-full bg-background">
            {props.tab.fileName.endsWith(".html") && (
                <div className="text-xs p-3 flex items-center text-muted-foreground">
                    <InfoIcon className="size-3 mr-2 shrink-0" />
                    Some links and downloads might not work in this built-in HTML preview. Try
                    opening the file directly after exporting the crate.
                </div>
            )}
            <iframe className="grow" src={url} sandbox={"allow-downloads allow-scripts"}></iframe>
        </div>
    )
}
