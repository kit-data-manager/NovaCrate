import { useCurrentEntity, useRegisterAction } from "@/lib/hooks"
import { useCallback, useContext } from "react"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { useEditorState } from "@/lib/state/editor-state"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { toArray } from "@/lib/utils"

export default function EntityActions() {
    const entity = useCurrentEntity()

    return entity ? <Handler entity={entity} /> : null
}

function Handler({ entity }: { entity: IFlatEntity }) {
    const { saveEntity } = useContext(CrateDataContext)
    const revertEntity = useEditorState.useRevertEntity()
    const addPropertyEntry = useEditorState.useAddPropertyEntry()
    const { showAddPropertyModal, showFindReferencesModal } = useContext(GlobalModalContext)

    const saveCurrentEntity = useCallback(() => {
        saveEntity(entity).then()
    }, [entity, saveEntity])
    useRegisterAction("save-entity", saveCurrentEntity, {
        keyboardShortcut: ["command", "s"]
    })

    const revertCurrentEntity = useCallback(() => {
        revertEntity(entity["@id"])
    }, [entity, revertEntity])
    useRegisterAction("revert-entity", revertCurrentEntity, {
        keyboardShortcut: ["command", "z"]
    })

    const addProperty = useCallback(() => {
        showAddPropertyModal(toArray(entity["@type"]), (type, value) => {
            addPropertyEntry(entity["@id"], type, value)
        })
    }, [addPropertyEntry, entity, showAddPropertyModal])
    useRegisterAction("add-property", addProperty, {
        keyboardShortcut: ["command", "e"]
    })

    const findReferences = useCallback(() => {
        showFindReferencesModal(entity["@id"])
    }, [entity, showFindReferencesModal])
    useRegisterAction("find-references", findReferences, {
        keyboardShortcut: ["command", "q"]
    })

    return null
}
