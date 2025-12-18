import { useEffect } from "react"
import { useEditorState } from "@/lib/state/editor-state"

export function UnsavedChangesProtector() {
    const hasUnsavedChanges = useEditorState((s) => s.getHasUnsavedChanges())

    useEffect(() => {
        if (!hasUnsavedChanges) return

        const listener = (e: BeforeUnloadEvent) => {
            e.preventDefault()
            e.returnValue = true
        }

        window.addEventListener("beforeunload", listener)

        return () => window.removeEventListener("beforeunload", listener)
    }, [hasUnsavedChanges])

    return null
}
