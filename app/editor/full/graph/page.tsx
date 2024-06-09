"use client"

import { ReactFlowProvider } from "reactflow"
import { EntityGraph } from "@/components/graph/entity-graph"
import { Metadata } from "@/components/Metadata"

export default function Graph() {
    return (
        <div className="w-full h-full">
            <Metadata page={"Graph"} />
            <ReactFlowProvider>
                <EntityGraph />
            </ReactFlowProvider>
        </div>
    )
}
