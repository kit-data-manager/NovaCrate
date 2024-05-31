import { useCurrentEntity, useRegisterAction } from "@/lib/hooks"
import { useCallback, useContext } from "react"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { useEditorState } from "@/lib/state/editor-state"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { toArray } from "@/lib/utils"
import { Copy, Plus, Save, Search, Trash, Undo2 } from "lucide-react"

export default function EntityActions() {
    const entity = useCurrentEntity()

    return entity ? <Handler entity={entity} /> : null
}

function Handler({ entity }: { entity: IFlatEntity }) {
    const { saveEntity } = useContext(CrateDataContext)
    const revertEntity = useEditorState.useRevertEntity()
    const addPropertyEntry = useEditorState.useAddPropertyEntry()
    const {
        showAddPropertyModal,
        showFindReferencesModal,
        showDeleteEntityModal,
        showSaveAsModal
    } = useContext(GlobalModalContext)

    const saveCurrentEntity = useCallback(() => {
        saveEntity(entity).then()
    }, [entity, saveEntity])
    useRegisterAction("entity.save", "Save", saveCurrentEntity, {
        keyboardShortcut: ["command", "s"],
        icon: Save
    })

    const saveCurrentEntityAs = useCallback(() => {
        showSaveAsModal(entity["@id"])
    }, [entity, showSaveAsModal])
    useRegisterAction("entity.save-as", "Save as...", saveCurrentEntityAs, {
        icon: Copy
    })

    const revertCurrentEntity = useCallback(() => {
        revertEntity(entity["@id"])
    }, [entity, revertEntity])
    useRegisterAction("entity.revert", "Revert Changes", revertCurrentEntity, {
        keyboardShortcut: ["command", "z"],
        icon: Undo2
    })

    const addProperty = useCallback(() => {
        showAddPropertyModal(toArray(entity["@type"]), (type, value) => {
            addPropertyEntry(entity["@id"], type, value)
        })
    }, [addPropertyEntry, entity, showAddPropertyModal])
    useRegisterAction("entity.add-property", "Add Property", addProperty, {
        keyboardShortcut: ["command", "e"],
        icon: Plus
    })

    const findReferences = useCallback(() => {
        showFindReferencesModal(entity["@id"])
    }, [entity, showFindReferencesModal])
    useRegisterAction("entity.find-references", "Find References", findReferences, {
        keyboardShortcut: ["command", "q"],
        icon: Search
    })

    const deleteEntity = useCallback(() => {
        showDeleteEntityModal(entity["@id"])
    }, [entity, showDeleteEntityModal])
    useRegisterAction("entity.delete", "Delete", findReferences, {
        icon: Trash
    })

    return null
}
