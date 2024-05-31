import { useCallback, useContext } from "react"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { useGoToMainMenu, useRegisterAction, useSaveAllEntities } from "@/lib/hooks"
import { useEditorState } from "@/lib/state/editor-state"
import { CrateDataContext } from "@/components/providers/crate-data-provider"

export default function DefaultActions() {
    const { showCreateEntityModal, showGlobalSearchModal } = useContext(GlobalModalContext)
    const revertAllEntities = useEditorState.useRevertAllEntities()
    const saveAllEntities = useSaveAllEntities()
    const { reload } = useContext(CrateDataContext)
    const gotToMainMenu = useGoToMainMenu()

    const createEntityAction = useCallback(() => {
        showCreateEntityModal()
    }, [showCreateEntityModal])
    useRegisterAction("create-entity", createEntityAction, { keyboardShortcut: ["command", "a"] })

    useRegisterAction("save-all-entities", saveAllEntities, {
        keyboardShortcut: ["shift", "command", "s"]
    })
    useRegisterAction("revert-all-entities", revertAllEntities, {
        keyboardShortcut: ["shift", "command", "z"]
    })
    useRegisterAction("reload-entities", reload, {
        keyboardShortcut: ["command", "r"]
    })
    useRegisterAction("global-search", showGlobalSearchModal, {
        keyboardShortcut: ["command", "k"]
    })
    useRegisterAction("close-editor", gotToMainMenu, {
        keyboardShortcut: ["command", "w"]
    })

    return null
}
