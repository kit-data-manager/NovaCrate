import { Handle, Position } from "reactflow"
import { ExternalLink } from "lucide-react"
import React from "react"

export default function ExternalNode({
    data,
    isConnectable,
    selected
}: {
    data: { id: string }
    isConnectable: boolean
    selected: boolean
}) {
    return (
        <>
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: "#555" }}
                onConnect={(params) => console.log("handle onConnect", params)}
                isConnectable={isConnectable}
                className="!border-none !bg-primary/80"
            />
            <div
                className={`p-2 rounded border border-accent bg-background max-w-[600px] transition ${selected ? "bg-secondary" : ""}`}
            >
                <div className="flex gap-2 items-center">
                    <ExternalLink className="w-4 h-4 ml-2" />

                    <div className="flex flex-col truncate text-sm">
                        <div className="truncate">{data.id}</div>
                    </div>
                </div>
            </div>
        </>
    )
}
