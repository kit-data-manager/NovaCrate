import { Handle, Position } from "reactflow"
import { ExternalLink, Plus } from "lucide-react"
import React, { useCallback, useContext } from "react"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger
} from "@/components/ui/context-menu"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"

export default function ExternalNode({
    data,
    isConnectable,
    selected
}: {
    data: { id: string }
    isConnectable: boolean
    selected: boolean
}) {
    const { showCreateEntityModal } = useContext(GlobalModalContext)

    const createEntity = useCallback(() => {
        showCreateEntityModal(undefined, undefined, data.id)
    }, [data.id, showCreateEntityModal])

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <Handle
                    type="target"
                    position={Position.Left}
                    style={{ background: "#555" }}
                    onConnect={(params) => console.log("handle onConnect", params)}
                    isConnectable={isConnectable}
                    className="border-none! bg-primary/80!"
                />
                <div
                    className={`p-2 rounded border border-accent bg-background max-w-[600px] transition ${selected ? "bg-secondary" : ""}`}
                >
                    <div className="flex gap-2 items-center">
                        <ExternalLink className="size-4 ml-2" />

                        <div className="flex flex-col truncate text-sm">
                            <div className="truncate">{data.id}</div>
                        </div>
                    </div>
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={createEntity}>
                    <Plus className="size-4 mr-2" /> Create Entity with this ID
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}
