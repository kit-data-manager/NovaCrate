import { useCallback, useContext } from "react"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { useRegisterAction } from "@/lib/hooks"

export default function DefaultActions() {
    const { showCreateEntityModal } = useContext(GlobalModalContext)

    const createEntityAction = useCallback(() => {
        showCreateEntityModal()
    }, [showCreateEntityModal])
    useRegisterAction("create-entity", createEntityAction, { keyboardShortcut: ["command", "a"] })

    return null
}
