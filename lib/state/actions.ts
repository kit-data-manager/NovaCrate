import { CircleHelp, LucideIcon } from "lucide-react"
import { immer } from "zustand/middleware/immer"
import { create } from "zustand"
import { unstable_ssrSafe as ssrSafe } from "zustand/middleware"

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

export const useActionsStore = create<ActionStore>()(
    ssrSafe(
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
)

const notFoundActionCache = new Map<string, Action>()
export function notFoundAction(id: string): Action {
    if (notFoundActionCache.has(id)) {
        return notFoundActionCache.get(id)!
    } else {
        const action: Action = {
            id: "not-found." + id,
            name: "Action not found",
            execute() {
                console.warn("Trying to execute action that was not found", { id })
            },
            notFound: true,
            icon: CircleHelp
        }
        notFoundActionCache.set(id, action)
        return action
    }
}
