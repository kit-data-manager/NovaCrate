import {
    useVirtualEntityEditor,
    EntityEditorCallbacks
} from "@/components/editor/use-virtual-entity-editor"
import { EntityEditor } from "@/components/editor/entity-editor"
import { forwardRef, useContext, useImperativeHandle, useMemo } from "react"
import { IEntityEditorTab } from "@/components/entity-tabs-provider"
import { CrateDataContext } from "@/components/crate-data-provider"

export const VirtualEntityEditor = forwardRef<
    EntityEditorCallbacks,
    {
        tab: IEntityEditorTab
        render: boolean
    }
>(function VirtualEntityEditor({ tab, render }, ref) {
    const { crateData } = useContext(CrateDataContext)

    const entityData = useMemo(() => {
        return crateData?.["@graph"].find((entity) => entity["@id"] === tab.entityId)
    }, [crateData, tab.entityId])

    const entityEditorProps = useVirtualEntityEditor(
        tab.entityId,
        tab.propertyEditorStates,
        entityData
    )

    useImperativeHandle(ref, () => {
        return {
            addProperty: entityEditorProps.addProperty,
            addPropertyEntry: entityEditorProps.addPropertyEntry,
            removeProperty: entityEditorProps.removeProperty,
            modifyProperty: entityEditorProps.modifyProperty,
            saveChanges: entityEditorProps.saveChanges,
            revertChanges: entityEditorProps.revertChanges
        }
    })

    if (!render) return null
    return <EntityEditor {...entityEditorProps} />
})
