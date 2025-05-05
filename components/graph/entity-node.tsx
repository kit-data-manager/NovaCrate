import { Handle, Position } from "reactflow"
import React, { useContext, useMemo } from "react"
import { camelCaseReadable, Diff, getEntityDisplayName, toArray } from "@/lib/utils"
import { EntityIcon } from "@/components/entity-icon"
import { Delete, Plus, Save, Trash, Undo2 } from "lucide-react"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuTrigger
} from "@/components/ui/context-menu"
import { useEditorState } from "@/lib/state/editor-state"
import { useGoToEntityEditor } from "@/lib/hooks"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { useGraphSettings } from "@/components/providers/graph-settings-provider"
import { useShallow } from "zustand/react/shallow"

export const NEW_PROP_HANDLE = "__special__newProp"

export interface EntityNodeHandle {
    name: string
    id: string
    text: boolean
}

function handlePos(index: number, total: number) {
    if (total === 0) {
        return `50%`
    } else return `${22 + index * 20}px`
}

export default function EntityNode({
    id,
    data,
    isConnectable,
    selected
}: {
    id: string
    data: { entityId: string; handles: EntityNodeHandle[] }
    isConnectable: boolean
    selected: boolean
}) {
    const entity = useEditorState((store) => store.getEntities().get(data.entityId))
    const entityHasChanges = useEditorState(
        useShallow((store) => store.getEntitiesChangelist().get(data.entityId) !== Diff.None)
    )
    const revertEntity = useEditorState((store) => store.revertEntity)
    const { saveEntity } = useContext(CrateDataContext)
    const { showDeleteEntityModal } = useContext(GlobalModalContext)

    const aggregateProperties = useGraphSettings((store) => store.aggregateProperties)
    const showTextProperties = useGraphSettings((store) => store.showTextProperties)

    const goToEntity = useGoToEntityEditor(entity)

    const handles = useMemo(() => {
        if (showTextProperties) {
            return data.handles
        } else {
            return data.handles.filter((h) => !h.text)
        }
    }, [data.handles, showTextProperties])

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <Handle
                    type="target"
                    position={Position.Left}
                    onConnect={(params) => console.log("handle onConnect", params)}
                    isConnectable={isConnectable}
                    className="border-none! bg-primary/80!"
                />
                <div
                    className={`p-3 rounded-lg border dark:border-accent bg-background max-w-[600px] ${selected ? "bg-secondary" : ""}`}
                >
                    <div className="flex gap-2 items-center">
                        <EntityIcon entity={entity} size="lg" unsavedChanges={entityHasChanges} />

                        <div className="flex flex-col truncate">
                            <div className={`truncate text-sm ${entity ? "" : "text-root"}`}>
                                {entity ? getEntityDisplayName(entity) : "Unknown Entity"}
                                {entity ? (
                                    <span className="text-muted-foreground text-xs truncate ml-1">
                                        {toArray(entity["@type"]).join(", ")}
                                    </span>
                                ) : null}
                            </div>
                            <span className="text-muted-foreground text-xs truncate">{id}</span>
                        </div>

                        {aggregateProperties ? null : (
                            <div className="flex flex-col gap-1 ml-2 text-right">
                                {handles.map((h) => {
                                    return (
                                        <div key={h.id} className="text-xs">
                                            {camelCaseReadable(h.name)}
                                        </div>
                                    )
                                })}

                                <div
                                    className={`text-muted-foreground text-xs flex items-center justify-end`}
                                >
                                    <Plus className="w-3 h-3 mt-1" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {aggregateProperties
                    ? null
                    : handles.map((h, i) => {
                          if (h.text) return null
                          return (
                              <Handle
                                  key={h.id}
                                  id={h.id}
                                  type="source"
                                  position={Position.Right}
                                  style={{ top: handlePos(i, handles.length) }}
                                  isConnectable={isConnectable}
                                  className="border-none! bg-primary/80!"
                              />
                          )
                      })}
                <Handle
                    id={NEW_PROP_HANDLE}
                    type="source"
                    position={Position.Right}
                    style={
                        aggregateProperties
                            ? { right: -2 }
                            : {
                                  top: handlePos(handles.length, handles.length)
                              }
                    }
                    isConnectable={isConnectable}
                    className="border-none! bg-primary/80!"
                />
            </ContextMenuTrigger>
            <ContextMenuContent>
                {entity ? (
                    <>
                        <ContextMenuItem onClick={() => goToEntity()}>
                            <EntityIcon entity={entity} size="sm" /> Open in Entity Editor
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                            onClick={() => saveEntity(entity)}
                            disabled={!entityHasChanges}
                        >
                            <Save className="size-4 mr-2" /> Save Changes
                        </ContextMenuItem>
                        <ContextMenuItem
                            onClick={() => revertEntity(data.entityId)}
                            disabled={!entityHasChanges}
                        >
                            <Undo2 className="size-4 mr-2" /> Revert Changes
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                            className="bg-destructive text-destructive-foreground"
                            onClick={() => showDeleteEntityModal(data.entityId)}
                        >
                            <Trash className="size-4 mr-2" />
                            Delete
                            <ContextMenuShortcut>
                                <Delete className="size-4 text-destructive-foreground/80" />
                            </ContextMenuShortcut>
                        </ContextMenuItem>
                    </>
                ) : null}
            </ContextMenuContent>
        </ContextMenu>
    )
}
