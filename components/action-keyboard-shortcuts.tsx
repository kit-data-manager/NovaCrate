import { Action } from "@/lib/actions"
import React, { useCallback, useEffect } from "react"
import { useActions } from "@/components/providers/actions-provider"

export function ActionKeyboardShortcuts() {
    const actions = useActions()
    const allActions = actions.getAllActions()

    return (
        <>
            {allActions
                .filter((action) => action.keyboardShortcut && action.keyboardShortcut.length > 0)
                .map((action) => (
                    <ShortcutHandler
                        action={action as Action & { keyboardShortcut: string[] }}
                        key={action.name}
                    />
                ))}
        </>
    )
}

export function ShortcutHandler({ action }: { action: Action & { keyboardShortcut: string[] } }) {
    const handler = useCallback(
        (e: KeyboardEvent) => {
            if (action.keyboardShortcut.includes("⌘") && !(e.metaKey || e.ctrlKey)) return
            if (action.keyboardShortcut.includes("command") && !(e.metaKey || e.ctrlKey)) return
            if (action.keyboardShortcut.includes("shift") && !e.shiftKey) return
            if (action.keyboardShortcut.includes("⇧") && !e.shiftKey) return
            if (action.keyboardShortcut.includes("⌥") && !e.altKey) return
            if (action.keyboardShortcut.includes("alt") && !e.altKey) return
            if (
                action.keyboardShortcut[action.keyboardShortcut.length - 1].toUpperCase() ===
                e.key.toUpperCase()
            ) {
                e.preventDefault()
                e.stopPropagation()
                console.log("Executing action on keyboard shortcut:", action.name)
                action.execute()
            }
        },
        [action]
    )

    useEffect(() => {
        document.addEventListener("keydown", handler)

        return () => document.removeEventListener("keydown", handler)
    }, [handler])

    return null
}
