import { Handle, Position } from "reactflow"
import React from "react"
import { getEntityDisplayName, toArray } from "@/lib/utils"
import { EntityIcon } from "@/components/entity-icon"

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
    data: { entity: IFlatEntity; handles: EntityNodeHandle[] }
    isConnectable: boolean
    selected: boolean
}) {
    return (
        <>
            <Handle
                type="target"
                position={Position.Left}
                onConnect={(params) => console.log("handle onConnect", params)}
                isConnectable={isConnectable}
                className="!border-none !bg-primary/80"
            />
            <div
                className={`p-3 rounded-lg border border-accent bg-background max-w-[600px] ${selected ? "bg-secondary" : ""}`}
            >
                <div className="flex gap-2 items-center">
                    <EntityIcon entity={data.entity} size="lg" />

                    <div className="flex flex-col truncate">
                        <div className="truncate text-sm">
                            {getEntityDisplayName(data.entity)}
                            <span className="text-muted-foreground text-xs truncate ml-1">
                                {toArray(data.entity["@type"]).join(", ")}
                            </span>
                        </div>
                        <span className="text-muted-foreground text-xs truncate">{id}</span>
                    </div>

                    <div className="flex flex-col gap-1 ml-2 text-right">
                        {data.handles.map((h) => {
                            return (
                                <div key={h.id} className="text-xs">
                                    {h.name}
                                </div>
                            )
                        })}

                        <div className={`text-xs opacity-0`}>add</div>
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
                id={"__special__newProp"}
                type="source"
                position={Position.Right}
                style={{
                    top: handlePos(data.handles.length, data.handles.length)
                }}
                isConnectable={isConnectable}
                className="!border-none !bg-primary/80"
            />
        </>
    )
}
