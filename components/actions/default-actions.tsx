import { useCallback, useContext } from "react"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { useGoToMainMenu, useRegisterAction, useSaveAllEntities } from "@/lib/hooks"
import { useEditorState } from "@/lib/state/editor-state"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { ArrowLeft, Cog, Plus, RefreshCw, SaveAll, Search, Undo2 } from "lucide-react"

export default function DefaultActions() {
    const { showCreateEntityModal, showGlobalSearchModal, showSettingsModal } =
        useContext(GlobalModalContext)
    const revertAllEntities = useEditorState.useRevertAllEntities()
    const saveAllEntities = useSaveAllEntities()
    const { reload } = useContext(CrateDataContext)
    const gotToMainMenu = useGoToMainMenu()

    const createEntityAction = useCallback(() => {
        showCreateEntityModal()
    }, [showCreateEntityModal])
    useRegisterAction("crate.add-entity", "Add new Entity", createEntityAction, {
        keyboardShortcut: ["shift", "command", "a"],
        icon: Plus
    })

    useRegisterAction("crate.save-all-entities", "Save all Entities", saveAllEntities, {
        keyboardShortcut: ["shift", "command", "s"],
        icon: SaveAll
    })
    useRegisterAction("crate.revert-all-entities", "Revert all Entities", revertAllEntities, {
        keyboardShortcut: ["shift", "command", "u"],
        icon: Undo2
    })
    useRegisterAction("crate.reload-entities", "Reload Entities", reload, {
        keyboardShortcut: ["command", "r"],
        icon: RefreshCw
    })
    useRegisterAction("editor.global-search", "Search", showGlobalSearchModal, {
        keyboardShortcut: ["command", "k"],
        icon: Search
    })
    useRegisterAction("editor.close", "Back to Main Menu", gotToMainMenu, {
        icon: ArrowLeft
    })

    useRegisterAction("editor.settings", "Settings", showSettingsModal, {
        icon: Cog,
        keyboardShortcut: ["command", "alt", "s"]
    })

    return null
}
