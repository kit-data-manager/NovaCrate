import { Handle, Position } from "reactflow"
import React, { useMemo } from "react"
import { camelCaseReadable, Diff, getEntityDisplayName, toArray } from "@/lib/utils"
import { EntityIcon } from "@/components/entity/entity-icon"
import { Plus } from "lucide-react"
import { useEditorState } from "@/lib/state/editor-state"
import { useGraphSettings } from "@/components/providers/graph-settings-provider"
import { useShallow } from "zustand/react/shallow"
import { EntityContextMenu } from "@/components/entity/entity-context-menu"

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

    const aggregateProperties = useGraphSettings((store) => store.aggregateProperties)
    const showTextProperties = useGraphSettings((store) => store.showTextProperties)

    const handles = useMemo(() => {
        if (showTextProperties) {
            return data.handles
        } else {
            return data.handles.filter((h) => !h.text)
        }
    }, [data.handles, showTextProperties])

    return (
        <EntityContextMenu entity={entity} asChild={false}>
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
        </EntityContextMenu>
    )
}
