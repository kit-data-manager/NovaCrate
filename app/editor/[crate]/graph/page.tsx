"use client"

import { ReactFlowProvider } from "reactflow"
import { EntityGraph } from "@/components/graph/entity-graph"

export default function Graph() {
    return (
        <div className="w-full h-full">
            <ReactFlowProvider>
                <EntityGraph />
            </ReactFlowProvider>
        </div>
    )
}
