import type { LucideIcon } from "lucide-react"
import { createStore } from "zustand/vanilla"
import { immer } from "zustand/middleware/immer"

export interface Action {
    id: string
    name: string
    description?: string
    execute: () => void
    keyboardShortcut?: string[]
    icon?: LucideIcon
    notFound?: boolean
}

export interface ActionStore {
    actions: Map<string, Action>
    getAllActions(): Action[]
    registerAction(action: Action): void
    unregisterAction(name: string): void
}

export const createActionStore = () =>
    createStore<ActionStore>()(
        immer((set, get) => ({
            actions: new Map(),
            getAllActions(): Action[] {
                return Array.from(get().actions.values())
            },
            registerAction(action: Action) {
                set((store) => {
                    store.actions.set(action.id, action)
                })
            },
            unregisterAction(id: string) {
                set((store) => {
                    store.actions.delete(id)
                })
            }
        }))
    )

export function notFoundAction(id: string): Action {
    return {
        id: "not-found." + id,
        name: "Action not found",
        execute() {
            console.warn("Trying to execute action that was not found", { id })
        },
        notFound: true
    }
}
