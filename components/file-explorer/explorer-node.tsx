import { FileTreeNode } from "@/components/file-explorer/utils"
import { NodeRendererProps } from "react-arborist"
import { useCallback, useState } from "react"
import { useStore } from "zustand"
import { editorState } from "@/lib/state/editor-state"
import { useGoToEntityEditor } from "@/lib/hooks"
import { fileExplorerSettings } from "@/lib/state/file-explorer-settings"
import { useFileExplorerState } from "@/lib/state/file-explorer-state"
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu"
import { ChevronRightIcon, EyeIcon, FileIcon, FolderIcon, PackageIcon } from "lucide-react"
import { EntityIcon } from "@/components/entity/entity-icon"
import { Input } from "@/components/ui/input"
import { getEntityDisplayName } from "@/lib/utils"
import { EntryContextMenu } from "@/components/file-explorer/entry-context-menu"

export function ExplorerNode({ node, style, dragHandle }: NodeRendererProps<FileTreeNode>) {
    const [renameValue, setRenameValue] = useState(node.data.name)
    const entity = useStore(
        editorState,
        (s) => s.getEntities().get(node.data.id) || s.getEntities().get("./" + node.data.id)
    )
    const goToEntity = useGoToEntityEditor(entity)
    const showEntities = useStore(fileExplorerSettings, (s) => s.showEntities)

    const previewingFilePath = useFileExplorerState((s) => s.previewingFilePath)
    const _setPreviewingFilePath = useFileExplorerState((store) => store.setPreviewingFilePath)
    const setPreviewingFilePath = useCallback(
        (path: string) => {
            if (path !== previewingFilePath) {
                _setPreviewingFilePath(path)
            }
        },
        [_setPreviewingFilePath, previewingFilePath]
    )

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div
                    ref={node.state.isEditing ? undefined : dragHandle}
                    style={style}
                    className={`flex items-center gap-1 ${node.state.isSelected && "bg-muted"} ${node.state.isSelectedEnd && "rounded-b-sm"} ${node.state.isSelectedStart && "rounded-t-sm"} p-1 outline-hidden`}
                    onDoubleClick={() => {
                        if (node.data.type === "file") setPreviewingFilePath(node.data.id)
                    }}
                >
                    <ChevronRightIcon
                        className={`size-4 text-muted-foreground ${node.state.isOpen && "rotate-90"} ${!node.id.endsWith("/") && "opacity-0"} shrink-0 mr-1`}
                        onClick={() => node.toggle()}
                    />
                    {showEntities && entity ? (
                        <EntityIcon entity={entity} className="shrink-0 mr-0.75" size="sm" />
                    ) : node.id === "./" ? (
                        <PackageIcon className="size-4 mr-1 shrink-0" />
                    ) : node.data.type === "file" ? (
                        <FileIcon className="size-4 mr-1 shrink-0" />
                    ) : (
                        <FolderIcon className="size-4 mr-1 shrink-0" />
                    )}
                    {node.state.isEditing ? (
                        <Input
                            className="p-1 h-6"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            autoFocus={true}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") node.submit(renameValue)
                                if (e.key === "Escape") node.reset()
                            }}
                            onBlur={() => node.reset()}
                        />
                    ) : (
                        <span className="select-none line-clamp-1">
                            {showEntities && entity ? getEntityDisplayName(entity) : node.data.name}
                        </span>
                    )}
                    {previewingFilePath === node.data.id && (
                        <EyeIcon className="size-4 shrink-0 ml-1" />
                    )}
                </div>
            </ContextMenuTrigger>
            <EntryContextMenu
                entity={entity}
                folder={node.data.type === "folder"}
                filePath={node.data.id}
                fileName={node.data.name}
                goToEntity={goToEntity}
                blankSpace={false}
                rename={
                    node.id !== "./" && node.id !== "ro-crate-metadata.json"
                        ? () =>
                              setTimeout(() => {
                                  node.edit()
                              }, 300)
                        : undefined
                }
            />
        </ContextMenu>
    )
}
