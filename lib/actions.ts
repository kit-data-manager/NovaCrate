import type { LucideIcon } from "lucide-react"

export enum ActionScope {
    EDITOR,
    CRATE,
    ENTITY
}

export interface Action {
    name: string
    description?: string
    scope: ActionScope
    execute: () => void
    keyboardShortcut?: string[]
    icon?: LucideIcon
    notFound?: boolean
}

export class Actions {
    private readonly actions: Map<string, Action> = new Map()

    getAllActions() {
        return Array.from(this.actions.values())
    }

    getAction(name: string) {
        return this.actions.get(name)
    }

    registerAction(action: Action) {
        this.actions.set(action.name, action)
    }

    unregisterAction(name: string) {
        this.actions.delete(name)
    }
}

export function notFoundAction(name: string): Action {
    return {
        name: "not-found." + name,
        scope: ActionScope.CRATE,
        execute() {
            console.warn("Trying to execute action that was not found", { name })
        },
        notFound: true
    }
}
