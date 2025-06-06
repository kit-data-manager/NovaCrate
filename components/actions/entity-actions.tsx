import { useCurrentEntity, useRegisterAction } from "@/lib/hooks"
import { useCallback, useContext } from "react"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { useEditorState } from "@/lib/state/editor-state"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { toArray } from "@/lib/utils"
import { Copy, Plus, Save, Search, Trash, Undo2 } from "lucide-react"
import { useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"

export default function EntityActions() {
    const entity = useCurrentEntity()

    return entity ? <Handler entity={entity} /> : null
}

function Handler({ entity }: { entity: IEntity }) {
    const { saveEntity } = useContext(CrateDataContext)
    const revertEntity = useEditorState((store) => store.revertEntity)
    const addPropertyEntry = useEditorState((store) => store.addPropertyEntry)
    const {
        showAddPropertyModal,
        showFindReferencesModal,
        showDeleteEntityModal,
        showSaveAsModal
    } = useContext(GlobalModalContext)
    const focusProperty = useEntityEditorTabs((store) => store.focusProperty)

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
        keyboardShortcut: ["command", "u"],
        icon: Undo2
    })

    const addProperty = useCallback(() => {
        showAddPropertyModal(toArray(entity["@type"]), (propertyName, value) => {
            addPropertyEntry(entity["@id"], propertyName, value)
            focusProperty(entity["@id"], propertyName)
        })
    }, [addPropertyEntry, entity, focusProperty, showAddPropertyModal])
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
    useRegisterAction("entity.delete", "Delete", deleteEntity, {
        icon: Trash
    })

    return null
}
