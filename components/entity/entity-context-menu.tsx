import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger
} from "@/components/ui/context-menu"
import { EntityIcon } from "@/components/entity/entity-icon"
import { Diff, canHavePreview as canHavePreviewUtil } from "@/lib/utils"
import { Eye, Folder, Save, Trash, Undo2 } from "lucide-react"
import { PropsWithChildren, useCallback, useContext, useMemo } from "react"
import { createEntityEditorTab, useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"
import { useEditorState } from "@/lib/state/editor-state"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { useGoToEntityEditor, useGoToFileExplorer } from "@/lib/hooks"

export function EntityContextMenu({
    entity,
    children,
    asChild
}: PropsWithChildren<{ entity?: IEntity; asChild: boolean }>) {
    const openTab = useEntityEditorTabs((store) => store.openTab)
    const setPreviewingFilePath = useEntityEditorTabs((store) => store.setPreviewingFilePath)
    const { saveEntity } = useContext(CrateDataContext)
    const revertEntity = useEditorState((store) => store.revertEntity)
    const { showDeleteEntityModal } = useContext(GlobalModalContext)
    const diff = useEditorState((state) => (entity ? state.getEntityDiff(entity["@id"]) : null))

    const canHavePreview = useMemo(() => {
        return entity ? canHavePreviewUtil(entity) : false
    }, [entity])

    const hasUnsavedChanges = useMemo(() => {
        return entity ? diff !== Diff.None : false
    }, [diff, entity])

    const openEditor = useGoToEntityEditor()

    const openSelf = useCallback(() => {
        if (!entity) return
        openTab(createEntityEditorTab(entity), true)
        openEditor()
    }, [entity, openTab, openEditor])

    const onSaveClick = useCallback(() => {
        if (entity) saveEntity(entity).then()
    }, [entity, saveEntity])

    const onRevertClick = useCallback(() => {
        if (entity) revertEntity(entity["@id"])
    }, [entity, revertEntity])

    const onDeleteClick = useCallback(() => {
        if (entity) showDeleteEntityModal(entity["@id"])
    }, [entity, showDeleteEntityModal])

    const onPreviewClick = useCallback(() => {
        if (entity) setPreviewingFilePath(entity["@id"])
    }, [entity, setPreviewingFilePath])

    const showInFileExplorer = useGoToFileExplorer(entity)

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild={asChild}>{children}</ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={openSelf}>
                    <EntityIcon entity={entity} size="sm" /> Open Tab
                </ContextMenuItem>
                {canHavePreview ? (
                    <>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={onPreviewClick}>
                            <Eye className="size-4 mr-2" /> Preview File
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => showInFileExplorer()}>
                            <Folder className="size-4 mr-2" /> Show in File Explorer
                        </ContextMenuItem>
                    </>
                ) : null}
                <ContextMenuSeparator />
                <ContextMenuItem onClick={onSaveClick} disabled={!hasUnsavedChanges}>
                    <Save className="size-4 mr-2" /> Save Entity
                </ContextMenuItem>
                <ContextMenuItem onClick={onRevertClick} disabled={!hasUnsavedChanges}>
                    <Undo2 className="size-4 mr-2" /> Revert Changes
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem variant={"destructive"} onClick={onDeleteClick}>
                    <Trash className="size-4 mr-2" /> Delete
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}
