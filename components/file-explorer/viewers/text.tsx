import { ViewerProps } from "@/components/file-explorer/viewers/base"
import { Editor } from "@monaco-editor/react"
import { useAsync } from "@/components/use-async"

async function blobAsText(blob: Blob) {
    return await blob.text()
}

export function TextViewer(props: ViewerProps) {
    const { data } = useAsync(props.data ?? null, blobAsText)

    if (!props.data) return null

    return (
        <div className="flex flex-col justify-center items-center h-full">
            <Editor value={data} options={{ readOnly: true }} />
        </div>
    )
}
