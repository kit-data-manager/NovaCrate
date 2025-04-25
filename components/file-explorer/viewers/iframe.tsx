import { ViewerProps } from "@/components/file-explorer/viewers/base"
import { useMemo } from "react"
import { InfoIcon } from "lucide-react"

export function IFrameViewer(props: ViewerProps) {
    const url = useMemo(() => {
        if (!props.data) return ""
        return URL.createObjectURL(props.data)
    }, [props.data])

    if (!props.data) return null

    return (
        <div className="flex flex-col h-full">
            <div className="text-xs p-3 bg-muted flex items-center text-muted-foreground">
                <InfoIcon className="size-3 mr-2 shrink-0" />
                Some links and downloads might not work in this built-in HTML preview. Try opening
                the file directly, after exporting the crate.
            </div>
            <iframe className="grow" src={url}></iframe>
        </div>
    )
}
