import { useCallback, useContext } from "react"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { useGoToMainMenu, useRegisterAction, useSaveAllEntities } from "@/lib/hooks"
import { useEditorState } from "@/lib/state/editor-state"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { ArrowLeft, Cog, Plus, RefreshCw, SaveAll, Search, Undo2, File } from "lucide-react"
import { generateCratePreview } from "@/lib/ro-crate-preview"
import { createEntityEditorTab, useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"

export default function DefaultActions() {
    const { showCreateEntityModal, showGlobalSearchModal, showSettingsModal } =
        useContext(GlobalModalContext)
    const crateData = useContext(CrateDataContext)
    const revertAllEntities = useEditorState.useRevertAllEntities()
    const openTab = useEntityEditorTabs((s) => s.openTab)
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

    const generateHTMLPreview = useCallback(async () => {
        if (!crateData.crateData) return
        const result = await generateCratePreview(crateData.crateData)
        const entity: IEntity = {
            "@id": "./ro-crate-preview.html",
            "@type": "File",
            name: "RO-Crate HTML Preview",
            description: "A HTML Preview for this RO-Crate generated with ro-crate-html"
        }
        // @ts-expect-error Blob is used as a File, but it works
        await crateData.createFileEntity(entity, result, true)
        openTab(createEntityEditorTab(entity), true)
    }, [crateData, openTab])
    useRegisterAction("crate.generate-html-preview", "Generate HTML Preview", generateHTMLPreview, {
        icon: File
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
