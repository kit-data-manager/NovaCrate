import { useCallback, useContext } from "react"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { useGoToMainMenu, useRegisterAction, useSaveAllEntities } from "@/lib/hooks/hooks"
import { useEditorState } from "@/lib/state/editor-state"
import { usePersistence } from "@/components/providers/persistence-provider"
import { useCrateMutations } from "@/lib/hooks/use-crate-mutations"
import { ArrowLeft, Cog, Plus, SaveAll, Search, Undo2, FileIcon, Info } from "lucide-react"
import { generateCratePreview } from "@/lib/ro-crate-preview"
import { createEntityEditorTab, useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"

export default function DefaultActions() {
    const { showCreateEntityModal, showGlobalSearchModal, showSettingsModal, showAboutModal } =
        useContext(GlobalModalContext)
    const persistence = usePersistence()
    const { createFileEntity } = useCrateMutations()
    const revertAllEntities = useEditorState((store) => store.revertAllEntities)
    const openTab = useEntityEditorTabs((s) => s.openTab)
    const saveAllEntities = useSaveAllEntities()
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

    const generateHTMLPreview = useCallback(async () => {
        const crateService = persistence.getCrateService()
        if (!crateService) return
        const raw = await crateService.getMetadata()
        const crateData = JSON.parse(raw) as ICrate
        const result = await generateCratePreview(crateData)
        if (!result) return

        const entity: IEntity = {
            "@id": "./ro-crate-preview.html",
            "@type": "File",
            name: "RO-Crate HTML Preview",
            description: "A HTML Preview for this RO-Crate generated with ro-crate-html"
        }
        const file = new File([result], "ro-crate-preview.html", { type: "text/html" })
        await createFileEntity(entity, file, true)
        openTab(createEntityEditorTab(entity), true)
    }, [createFileEntity, openTab, persistence])
    useRegisterAction("crate.generate-html-preview", "Generate HTML Preview", generateHTMLPreview, {
        icon: FileIcon
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

    useRegisterAction("editor.about", "About", showAboutModal, {
        icon: Info
    })

    return null
}
