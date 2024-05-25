"use client"

import { Editor, Monaco } from "@monaco-editor/react"
import React, { useCallback, useContext, useEffect, useRef, useState } from "react"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { useTheme } from "next-themes"
import type { editor } from "monaco-editor"
import { Braces, CircleAlert, Dot, Info, Save, SaveAll, Undo2 } from "lucide-react"
import { useEditorState } from "@/lib/state/editor-state"
import { Error } from "@/components/error"
import { Button } from "@/components/ui/button"
import { useSaveAllEntities } from "@/lib/hooks"

export default function JSONEditorPage() {
    const hasUnsavedChanges = useEditorState((store) => store.getHasUnsavedChanges())
    const revertAllEntities = useEditorState.useRevertAllEntities()
    const { crateData, saveRoCrateMetadataJSON, isSaving } = useContext(CrateDataContext)
    const [crateDataProxy, setCrateDataProxy] = useState(crateData)
    const theme = useTheme()
    const [editorHasErrors, setEditorHasErrors] = useState(false)
    const editorValue = useRef<string | undefined>()
    const [editorHasChanges, setEditorHasChanges] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<unknown>()

    useEffect(() => {
        if (crateDataProxy === undefined && crateData) {
            setCrateDataProxy(crateData)
        }
    }, [crateData, crateDataProxy])

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

    const handleChange = useCallback((value: string | undefined) => {
        if (value) {
            if (editorValue.current) setEditorHasChanges(true)
            editorValue.current = value
        }
    }, [])

    const handleValidate = useCallback((markers: editor.IMarker[] | undefined) => {
        if (markers && markers.length > 0) {
            if (markers.find((m) => m.severity === 8)) {
                return setEditorHasErrors(true)
            }
        }

        setEditorHasErrors(false)
    }, [])

    const saveChanges = useCallback(() => {
        if (editorValue.current) {
            setSaving(true)
            setEditorHasChanges(false)
            saveRoCrateMetadataJSON(editorValue.current)
                .then(() => {
                    setSaveError(undefined)
                })
                .catch(setSaveError)
                .finally(() => {
                    setSaving(false)
                })
        }
    }, [saveRoCrateMetadataJSON])

    const shortcutHandler = useCallback(
        (event: KeyboardEvent) => {
            if (event.key == "s" && (event.ctrlKey || event.metaKey)) {
                event.preventDefault()
                saveChanges()
            }
        },
        [saveChanges]
    )

    const unloadHandler = useCallback(
        (event: BeforeUnloadEvent) => {
            if (editorHasChanges) {
                const leave = window.confirm(
                    "There are unsaved changes. Leaving the page will dismiss all unsaved changes. Are you sure you want to leave the page?"
                )
                if (!leave) event.preventDefault()
            }
        },
        [editorHasChanges]
    )

    useEffect(() => {
        window.addEventListener("keydown", shortcutHandler)
        document.querySelectorAll("a").forEach((a) => a.addEventListener("click", unloadHandler))
        window.addEventListener("beforeunload", unloadHandler)

        return () => {
            window.removeEventListener("keydown", shortcutHandler)
            document
                .querySelectorAll("a")
                .forEach((a) => a.removeEventListener("click", unloadHandler))
            window.removeEventListener("beforeunload", unloadHandler)
        }
    }, [shortcutHandler, unloadHandler])

    const saveAllEntities = useSaveAllEntities()

    return (
        <div className="w-full h-full flex flex-col relative">
            <div className="pl-4 bg-accent text-sm h-10 flex items-center shrink-0">
                <Braces className="w-4 h-4 shrink-0 mr-2" />
                JSON Editor
                <span className="flex gap-1 items-center text-muted-foreground ml-1">
                    <Dot className="w-4 h-4" />
                    ro-crate-metadata.json
                </span>
            </div>
            {hasUnsavedChanges ? (
                <div className="flex justify-center items-center grow">
                    <div className="p-4 border rounded-lg max-w-[600px] flex flex-col gap-4">
                        <h3 className="text-lg font-semibold">Unsaved Changes</h3>
                        <div>
                            The JSON Editor is not available while there are unsaved changes in the
                            Entities Editor. Please save all changes or revert all changes if you
                            want to continue to the JSON Editor.
                        </div>
                        <div className="flex justify-between">
                            <Button
                                variant="secondary"
                                onClick={revertAllEntities}
                                disabled={isSaving}
                            >
                                <Undo2 className="w-4 h-4 mr-2" /> Revert all Entities
                            </Button>
                            <Button onClick={saveAllEntities} disabled={isSaving}>
                                <SaveAll className="w-4 h-4 mr-2" /> Save all Entities
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <Error error={saveError} title="Failed to save changes" />
                    <div className="flex gap-2 absolute top-12 right-[140px] z-10 bg-accent/60 items-center rounded-lg">
                        <Noticer
                            hasErrors={editorHasErrors}
                            hasChanges={editorHasChanges}
                            saveChanges={saveChanges}
                            saving={saving}
                        />
                    </div>
                    <Editor
                        value={JSON.stringify(crateDataProxy)}
                        defaultLanguage="json"
                        theme={theme.theme === "dark" ? "ro-crate-editor" : "light"}
                        onMount={handleMount}
                        onChange={handleChange}
                        onValidate={handleValidate}
                    />
                </>
            )}
        </div>
    )
}

function Noticer({
    hasErrors,
    hasChanges,
    saveChanges,
    saving
}: {
    hasErrors: boolean
    hasChanges: boolean
    saveChanges(): void
    saving: boolean
}) {
    if (hasErrors) {
        return (
            <div className="flex items-center p-2 px-4 gap-2">
                <CircleAlert className="w-4 h-4 text-root" />
                <span className="text-root text-sm">
                    There are errors in the JSON file. Fix them before saving.
                </span>
            </div>
        )
    } else if (hasChanges || saving) {
        return (
            <button
                className="flex items-center p-2 px-4 gap-2 disabled:text-muted-foreground disabled:cursor-not-allowed"
                onClick={saveChanges}
                disabled={saving}
            >
                <Save className="w-4 h-4" />
                <span className="text-sm">Save</span>
                <div className="text-xs text-muted-foreground">⌘S</div>
            </button>
        )
    } else {
        return (
            <div className="flex items-center p-2 px-4 gap-2">
                <Info className="w-4 h-4" />
                <span>This is an expert feature. Be cautious while editing your data.</span>
            </div>
        )
    }
}
