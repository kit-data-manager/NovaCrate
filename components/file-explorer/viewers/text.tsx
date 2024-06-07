import { ViewerProps } from "@/components/file-explorer/viewers/base"
import { Editor } from "@monaco-editor/react"
import { useAsync } from "@/lib/hooks"
import { useTheme } from "next-themes"
import { useHandleMonacoMount } from "@/lib/monaco"

async function blobAsText(blob: Blob) {
    return await blob.text()
}

export function TextViewer(props: ViewerProps) {
    const { data } = useAsync(props.data ?? null, blobAsText)
    const theme = useTheme()

    const handleMount = useHandleMonacoMount()

    if (!props.data) return null

    return (
        <div className="flex flex-col justify-center items-center h-full">
            <Editor
                value={data}
                options={{ readOnly: true }}
                defaultLanguage={props.data.type}
                onMount={handleMount}
                theme={theme.theme === "dark" ? "crate-dark" : "light"}
            />
        </div>
    )
}
