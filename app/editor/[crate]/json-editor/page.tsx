"use client"

import { Editor, Monaco } from "@monaco-editor/react"
import React, { useCallback, useContext } from "react"
import { CrateDataContext } from "@/components/crate-data-provider"
import { useTheme } from "next-themes"
import type { editor } from "monaco-editor"
import { Check, Info, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEditorState } from "@/components/editor-state"

export default function JSONEditorPage() {
    const hasUnsavedChanges = useEditorState((store) => store.getHasUnsavedChanges())
    const { crateData } = useContext(CrateDataContext)
    const theme = useTheme()

    const handleMount = useCallback((editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
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
        monaco.editor.setTheme("ro-crate-editor")
    }, [])

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex gap-2 sticky top-0 z-10 p-2 bg-accent items-center px-4">
                <Info className="w-4 h-4" />
                <span>This is an expert feature. Be cautious while editing your data.</span>
                <div className="grow" />
                <span>Saved</span>
                <Check className="w-4 h-4" />
            </div>
            {hasUnsavedChanges ? (
                <div className="flex justify-center items-center grow">
                    <div className="p-4 border rounded-lg max-w-[600px] flex flex-col gap-4">
                        <h3 className="text-lg font-semibold">Unsaved Changes</h3>
                        <div>
                            The JSON Editor is not available while there are unsaved changes. Please
                            save all changes or revert all changes if you want to continue to the
                            JSON Editor.
                        </div>
                        <div className="flex justify-between">
                            <Button variant="outline">Revert Changes</Button>
                            <Button>
                                <Save className="w-4 h-4 mr-2" /> Save
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <Editor
                    value={JSON.stringify(crateData)}
                    defaultLanguage="json"
                    theme={theme.theme === "dark" ? "ro-crate-editor" : "light"}
                    onMount={handleMount}
                />
            )}
        </div>
    )
}
