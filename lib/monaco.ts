import { useCallback } from "react"
import { Monaco } from "@monaco-editor/react"
import { useTheme } from "next-themes"
import type { editor } from "monaco-editor"

/**
 * Utility to apply desired settings to the monaco editor
 */
export function useHandleMonacoMount() {
    const theme = useTheme()

    return useCallback(
        (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
            setTimeout(() => {
                editor.getAction("editor.action.formatDocument")?.run()
            }, 100)

            monaco.editor.defineTheme("crate-dark", {
                base: "vs-dark",
                colors: {
                    "editor.background": "#000000"
                },
                inherit: true,
                rules: [],
                encodedTokensColors: []
            })
            if (theme.resolvedTheme === "dark") monaco.editor.setTheme("crate-dark")
        },
        [theme.resolvedTheme]
    )
}
