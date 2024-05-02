"use client"

import { Editor, Monaco } from "@monaco-editor/react"
import React, { useCallback, useContext, useRef, useState } from "react"
import { CrateDataContext } from "@/components/crate-data-provider"
import { useTheme } from "next-themes"
import type { editor } from "monaco-editor"
import { Braces, CircleAlert, Info, Save, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEditorState } from "@/components/editor-state"

export default function JSONEditorPage() {
    const hasUnsavedChanges = useEditorState((store) => store.getHasUnsavedChanges())
    const { crateData } = useContext(CrateDataContext)
    const theme = useTheme()
    const [editorHasErrors, setEditorHasErrors] = useState(false)
    const editorValue = useRef<string | undefined>()
    const [editorHasChanges, setEditorHasChanges] = useState(false)

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

    const handleChange = useCallback((value: string | undefined) => {
        if (value) {
            if (editorValue.current) setEditorHasChanges(true)
            editorValue.current = value
        }
    }, [])

    const handleValidate = useCallback((markers: editor.IMarker[] | undefined) => {
        console.log(markers)
        if (markers && markers.length > 0) {
            if (markers.find((m) => m.severity === 8)) {
                return setEditorHasErrors(true)
            }
        }

        setEditorHasErrors(false)
    }, [])

    return (
        <div className="w-full h-full flex flex-col">
            <div className="pl-4 bg-accent text-sm h-10 flex items-center shrink-0">
                <Braces className="w-4 h-4 shrink-0 mr-2" />
                JSON-Editor
            </div>
            <div className="flex gap-2 sticky top-0 z-10 p-2 px-4 bg-accent items-center">
                <Noticer hasErrors={editorHasErrors} hasChanges={editorHasChanges} />
                <div className="grow"></div>
                <Button
                    size="sm"
                    variant={editorHasChanges ? undefined : "outline"}
                    className={`text-xs`}
                    disabled={editorHasErrors}
                >
                    <Save className={`w-4 h-4 mr-2`} /> Apply Changes
                </Button>
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
                    onChange={handleChange}
                    onValidate={handleValidate}
                />
            )}
        </div>
    )
}

function Noticer({ hasErrors, hasChanges }: { hasErrors: boolean; hasChanges: boolean }) {
    if (hasErrors) {
        return (
            <>
                <CircleAlert className="w-4 h-4 text-root" />
                <span className="text-root">
                    There are errors in the JSON file. Fix them before saving.
                </span>
            </>
        )
    } else if (hasChanges) {
        return (
            <>
                <TriangleAlert className="w-4 h-4" />
                <span>Your changes will not be applied until you save.</span>
            </>
        )
    } else {
        return (
            <>
                <Info className="w-4 h-4" />
                <span>This is an expert feature. Be cautious while editing your data.</span>
            </>
        )
    }
}
