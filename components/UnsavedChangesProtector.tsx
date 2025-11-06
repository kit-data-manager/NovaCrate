import { useEffect } from "react"
import { useEditorState } from "@/lib/state/editor-state"
import { useNavigationGuard } from "next-navigation-guard"

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

    useNavigationGuard({
        enabled: hasUnsavedChanges,
        confirm: () =>
            window.confirm(
                "You have unsaved changes. Leaving the page means you will lose your changes. Are you sure you want to leave the page?"
            )
    })

    return null
}
