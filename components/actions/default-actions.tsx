import { useCallback, useContext } from "react"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { useGoToMainMenu, useRegisterAction, useSaveAllEntities } from "@/lib/hooks/hooks"
import { useEditorState } from "@/lib/state/editor-state"
import { usePersistence } from "@/components/providers/persistence-provider"
import { useCrateMutations } from "@/lib/hooks/use-crate-mutations"
import {
    ArrowLeft,
    Cog,
    Plus,
    SaveAll,
    Search,
    Undo2,
    FileIcon,
    Info,
    SparklesIcon
} from "lucide-react"
import { generateCratePreview } from "@/lib/ro-crate-preview"
import { createEntityEditorTab, useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"
import { toast } from "sonner"
import { useLayoutState } from "@/lib/state/layout-state"

export default function DefaultActions() {
    const { showCreateEntityModal, showGlobalSearchModal, showSettingsModal, showAboutModal } =
        useContext(GlobalModalContext)
    const persistence = usePersistence()
    const { createFileEntity } = useCrateMutations()
    const revertAllEntities = useEditorState((store) => store.revertAllEntities)
    const openTab = useEntityEditorTabs((s) => s.openTab)
    const saveAllEntities = useSaveAllEntities()
    const goToMainMenu = useGoToMainMenu()

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
        const writeSuccess = await createFileEntity(entity, file, true)
        if (writeSuccess) {
            openTab(createEntityEditorTab(entity), true)
        } else {
            toast.error("Failed to create preview file")
        }
    }, [createFileEntity, openTab, persistence])
    useRegisterAction("crate.generate-html-preview", "Generate HTML Preview", generateHTMLPreview, {
        icon: FileIcon
    })

    useRegisterAction("editor.global-search", "Search", showGlobalSearchModal, {
        keyboardShortcut: ["command", "k"],
        icon: Search
    })
    useRegisterAction("editor.close", "Back to Main Menu", goToMainMenu, {
        icon: ArrowLeft
    })

    useRegisterAction("editor.settings", "Settings", showSettingsModal, {
        icon: Cog,
        keyboardShortcut: ["command", "alt", "s"]
    })

    useRegisterAction("editor.about", "About", showAboutModal, {
        icon: Info
    })

    const toggleAIAssistant = useCallback(() => {
        if (process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED === "true") {
            const layoutState = useLayoutState.getState()
            layoutState.setShowAIAssistant(!layoutState.showAIAssistant)
        } else {
            toast.error("AI Assistant is not enabled")
        }
    }, [])

    useRegisterAction("editor.toggle-ai-assistant", "Toggle AI Assistant", toggleAIAssistant, {
        icon: SparklesIcon
    })

    return null
}
