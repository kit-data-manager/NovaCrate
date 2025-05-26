import { ViewerProps } from "@/components/file-explorer/viewers/base"
import { Editor } from "@monaco-editor/react"
import { useTheme } from "next-themes"
import { useHandleMonacoMount } from "@/lib/monaco"
import { useEffect, useState } from "react"

async function blobAsText(blob: Blob) {
    return await blob.text()
}

export function TextViewer(props: ViewerProps) {
    const [data, setData] = useState<string>()
    const theme = useTheme()

    useEffect(() => {
        if (props.data) blobAsText(props.data).then(setData)
    }, [props.data])

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
