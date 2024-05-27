import { Handle, Position } from "reactflow"
import React from "react"
import { camelCaseReadable, getEntityDisplayName, toArray } from "@/lib/utils"
import { EntityIcon } from "@/components/entity-icon"
import { Plus } from "lucide-react"
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "@/components/ui/context-menu"
import { useEditorState } from "@/lib/state/editor-state"

export const NEW_PROP_HANDLE = "__special__newProp"

export interface EntityNodeHandle {
    name: string
    id: string
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

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <Handle
                    type="target"
                    position={Position.Left}
                    onConnect={(params) => console.log("handle onConnect", params)}
                    isConnectable={isConnectable}
                    className="!border-none !bg-primary/80"
                />
                <div
                    className={`p-3 rounded-lg border dark:border-accent bg-background max-w-[600px] ${selected ? "bg-secondary" : ""}`}
                >
                    <div className="flex gap-2 items-center">
                        <EntityIcon entity={entity} size="lg" />

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

                        <div className="flex flex-col gap-1 ml-2 text-right">
                            {data.handles.map((h) => {
                                return (
                                    <div key={h.id} className="text-xs">
                                        {camelCaseReadable(h.name)}
                                    </div>
                                )
                            })}

                            <div
                                className={`text-muted-foreground text-xs flex items-center justify-end`}
                            >
                                <Plus className="w-3 h-3" />
                            </div>
                        </div>
                    </div>
                </div>
                {data.handles.map((h, i) => {
                    return (
                        <Handle
                            key={h.id}
                            id={h.id}
                            type="source"
                            position={Position.Right}
                            style={{ top: handlePos(i, data.handles.length) }}
                            isConnectable={isConnectable}
                            className="!border-none !bg-primary/80"
                        />
                    )
                })}
                <Handle
                    id={NEW_PROP_HANDLE}
                    type="source"
                    position={Position.Right}
                    style={{
                        top: handlePos(data.handles.length, data.handles.length)
                    }}
                    isConnectable={isConnectable}
                    className="!border-none !bg-primary/80"
                />
            </ContextMenuTrigger>
            <ContextMenuContent>Hallo!</ContextMenuContent>
        </ContextMenu>
    )
}
