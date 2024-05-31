import { Action } from "@/lib/state/actions"
import React, { useCallback, useEffect, useMemo } from "react"
import { useActionsStore } from "@/components/providers/actions-provider"
import { ArrowBigUp } from "lucide-react"

export function ActionKeyboardShortcuts() {
    const actions = useActionsStore((store) => store.getAllActions())

    return (
        <>
            {actions
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

export function KeyboardShortcut({ action }: { action: Action }) {
    const hasShift = useMemo(() => {
        return (
            !!action.keyboardShortcut &&
            (action.keyboardShortcut.includes("shift") || action.keyboardShortcut.includes("⇧"))
        )
    }, [action.keyboardShortcut])

    const hasCommand = useMemo(() => {
        return (
            !!action.keyboardShortcut &&
            (action.keyboardShortcut.includes("command") || action.keyboardShortcut.includes("⌘"))
        )
    }, [action.keyboardShortcut])

    const hasAlt = useMemo(() => {
        return (
            !!action.keyboardShortcut &&
            (action.keyboardShortcut.includes("alt") || action.keyboardShortcut.includes("⌥"))
        )
    }, [action.keyboardShortcut])

    const letter = useMemo(() => {
        return action.keyboardShortcut
            ? action.keyboardShortcut[action.keyboardShortcut.length - 1].toUpperCase()
            : ""
    }, [action.keyboardShortcut])

    if (!action.keyboardShortcut) return null

    return (
        <span className="flex">
            {hasShift ? <ArrowBigUp className="w-4 h-4" /> : null}
            {hasAlt ? "⌥" : null}
            {hasCommand ? "⌘" : null}
            {letter}
        </span>
    )
}
