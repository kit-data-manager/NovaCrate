import { CircleHelp, LucideIcon } from "lucide-react"
import { immer } from "zustand/middleware/immer"
import { create } from "zustand"

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
    isReady(): boolean
}

export const createActionStore = () =>
    create<ActionStore>()(
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
            },
            isReady(): boolean {
                // Assuming that the action store is not ready as long as there are no actions
                return get().actions.size > 0
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
        notFound: true,
        icon: CircleHelp
    }
}
