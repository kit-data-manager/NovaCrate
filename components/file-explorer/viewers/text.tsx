import { ViewerProps } from "@/components/file-explorer/viewers/base"
import { Editor, Monaco } from "@monaco-editor/react"
import { useAsync } from "@/lib/hooks"
import { useCallback } from "react"
import type { editor } from "monaco-editor"
import { useTheme } from "next-themes"

async function blobAsText(blob: Blob) {
    return await blob.text()
}

export function TextViewer(props: ViewerProps) {
    const { data } = useAsync(props.data ?? null, blobAsText)
    const theme = useTheme()

    const handleMount = useCallback(
        (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
            setTimeout(() => {
                editor.getAction("editor.action.formatDocument")?.run()
            }, 100)

            monaco.editor.defineTheme("ro-crate-editor", {
                base: "vs-dark",
                colors: {
                    "editor.background": "#000000"
                },
                inherit: true,
                rules: [],
                encodedTokensColors: []
            })
            if (theme.theme === "dark") monaco.editor.setTheme("ro-crate-editor")
        },
        [theme.theme]
    )

    if (!props.data) return null

    return (
        <div className="flex flex-col justify-center items-center h-full">
            <Editor
                value={data}
                options={{ readOnly: true }}
                defaultLanguage={props.data.type}
                onMount={handleMount}
                theme={theme.theme === "dark" ? "ro-crate-editor" : "light"}
            />
        </div>
    )
}
