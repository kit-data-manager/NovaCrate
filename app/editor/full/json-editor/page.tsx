"use client"

import { Editor } from "@monaco-editor/react"
import React, { useCallback, useContext, useEffect, useRef, useState } from "react"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { useTheme } from "next-themes"
import type { editor } from "monaco-editor"
import {
    Braces,
    CircleAlert,
    Dot,
    Download,
    Save,
    SaveAll,
    TriangleAlert,
    Undo2
} from "lucide-react"
import { useEditorState } from "@/lib/state/editor-state"
import { Error } from "@/components/error"
import { Button } from "@/components/ui/button"
import { useSaveAllEntities } from "@/lib/hooks"
import { useHandleMonacoMount } from "@/lib/monaco"
import { Metadata } from "@/components/Metadata"
import fileDownload from "js-file-download"
import useSWR from "swr"

export default function JSONEditorPage() {
    const hasUnsavedChanges = useEditorState((store) => store.getHasUnsavedChanges())
    const revertAllEntities = useEditorState((store) => store.revertAllEntities)
    const { crateData, saveRoCrateMetadataJSON, isSaving, serviceProvider, crateId } =
        useContext(CrateDataContext)
    const theme = useTheme()
    const [editorHasErrors, setEditorHasErrors] = useState(false)
    const editorValue = useRef<string | undefined>(undefined)
    const [editorHasChanges, setEditorHasChanges] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<unknown>()

    const { data, mutate, error } = useSWR(
        crateId && serviceProvider && crateData + "/ro-crate-metadata.json",
        () => {
            if (!crateId || !serviceProvider) return undefined
            return serviceProvider.getCrateRaw(crateId)
        }
    )

    useEffect(() => {
        if (crateData) mutate().then()
    }, [crateData, mutate])

    const handleMount = useHandleMonacoMount()

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

    const download = useCallback(() => {
        if (editorValue.current)
            fileDownload(editorValue.current, "ro-crate-metadata.json", "application/json")
    }, [])

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
        <div className="w-full h-full flex flex-col relative bg-background rounded-lg border overflow-hidden">
            <Metadata page={"JSON Editor"} />
            <div className="pl-4 pr-2 border-b text-sm h-10 flex items-center shrink-0 bg-accent overflow-x-hidden no-scrollbar">
                <Braces className="size-4 shrink-0 mr-2" />
                JSON Metadata Editor
                <span className="flex gap-1 items-center text-muted-foreground ml-1">
                    <Dot className="size-4" />
                    ro-crate-metadata.json
                </span>
                <div className="grow" />
                <div>
                    {editorHasChanges ? (
                        <div className="flex text-warn items-center mr-2">
                            <TriangleAlert className="absolute size-4 mr-2 animate-ping" />
                            <TriangleAlert className="size-4 mr-2" /> Unsaved Changes
                        </div>
                    ) : null}
                </div>
                <Button
                    variant="outline"
                    size={"sm"}
                    onClick={saveChanges}
                    disabled={saving || editorHasErrors || !editorHasChanges}
                    className="mr-2"
                >
                    <Save className="size-4 mr-2" />
                    <span className="text-sm">Save</span>
                    <div className="ml-1 text-xs text-muted-foreground">⌘S</div>
                </Button>
                <Button size="sm" variant="outline" onClick={download}>
                    <Download className="size-4 mr-2" /> Download
                </Button>
            </div>
            {hasUnsavedChanges ? (
                <div className="flex justify-center items-center grow">
                    <div className="p-4 border rounded-lg max-w-150 flex flex-col gap-4">
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
                                <Undo2 className="size-4 mr-2" /> Revert all Entities
                            </Button>
                            <Button onClick={saveAllEntities} disabled={isSaving}>
                                <SaveAll className="size-4 mr-2" /> Save all Entities
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <Error error={saveError} title="Failed to save changes" />
                    <Error error={error} title="Failed to load JSON" />
                    <div className="flex gap-2 absolute top-12 right-35 z-10 bg-accent/60 items-center rounded-lg">
                        <Noticer hasErrors={editorHasErrors} hasChanges={editorHasChanges} />
                    </div>
                    <Editor
                        value={data}
                        defaultLanguage="json"
                        theme={theme.resolvedTheme === "dark" ? "crate-dark" : "light"}
                        onMount={handleMount}
                        onChange={handleChange}
                        onValidate={handleValidate}
                    />
                </>
            )}
        </div>
    )
}

function Noticer({ hasErrors, hasChanges }: { hasErrors: boolean; hasChanges: boolean }) {
    if (hasErrors) {
        return (
            <div className="flex items-center p-2 px-4 gap-2 animate-w-grow bg-destructive rounded-lg">
                <CircleAlert className="size-4" />
                <span className="text-sm">
                    There are errors in the JSON file. Fix them before saving.
                </span>
            </div>
        )
    } else if (hasChanges) {
        return null
    } else {
        return (
            <div className="flex items-center p-2 px-4 gap-2 text-warn">
                <TriangleAlert className="size-4" />
                <TriangleAlert className="absolute size-4 animate-ping" />
                <span>This is an expert feature. Be cautious while editing your data.</span>
            </div>
        )
    }
}
