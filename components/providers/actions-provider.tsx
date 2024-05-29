import { createContext, PropsWithChildren, useContext, useRef } from "react"
import { Actions } from "@/lib/actions"

const ActionsContext = createContext<Actions | null>(null)

export function ActionsProvider(props: PropsWithChildren) {
    const actions = useRef(new Actions())

    return (
        <ActionsContext.Provider value={actions.current}>{props.children}</ActionsContext.Provider>
    )
}

export function useActions() {
    const actions = useContext(ActionsContext)

    if (!actions) throw "useActions used outside of ActionsContext"
    return actions
}
