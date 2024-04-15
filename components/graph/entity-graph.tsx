"use client"

import React, { useCallback, useContext, useEffect } from "react"
import ReactFlow, {
    addEdge,
    Background,
    Connection,
    ConnectionLineType,
    Edge,
    Node,
    Panel,
    ReactFlowProvider,
    useEdgesState,
    useNodesState,
    useReactFlow
} from "reactflow"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { Fullscreen, GitCompare, Rows2, Rows4 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import EntityNode, { EntityNodeHandle } from "@/components/graph/entity-node"
import { useLayout } from "@/components/graph/layout"
import { CrateDataContext } from "@/components/crate-data-provider"
import { isReference, toArray } from "@/lib/utils"
import ExternalNode from "@/components/graph/external-node"

const DEFAULT_POS = { x: 0, y: 0 }

const nodeTypes = {
    entityNode: EntityNode,
    externalNode: ExternalNode
}

function crateToGraph(crate: ICrate): [Node[], Edge[]] {
    const nodes: Node[] = []
    const edges: Edge[] = []

    function autoPushHandle(node?: Node, handle?: EntityNodeHandle) {
        if (!node || !handle) return
        if (!node.data.handles || !Array.isArray(node.data.handles)) {
            node.data.handles = []
        }

        if (!node.data.handles.find((h: EntityNodeHandle) => h.id === handle.id)) {
            node.data.handles.push(handle)
        }
    }

    for (const entity of crate["@graph"]) {
        nodes.push({
            id: entity["@id"],
            position: DEFAULT_POS,
            data: {
                entity,
                handles: []
            },
            type: "entityNode"
        })

        for (const [key, value] of Object.entries(entity)) {
            if (key === "@id" || key === "@type") continue
            const values = toArray(value)
            for (const singleValue of values) {
                if (isReference(singleValue) && singleValue["@id"] !== "") {
                    let target = singleValue["@id"]
                    const index = values.indexOf(singleValue)

                    if (!crate["@graph"].find((n) => n["@id"] === singleValue["@id"])) {
                        target = `${entity["@id"]}#${key}[${index}]-external`
                        nodes.push({
                            id: target,
                            position: DEFAULT_POS,
                            data: { id: singleValue["@id"] },
                            type: "externalNode"
                        })
                    }

                    edges.push({
                        id: `${entity["@id"]}#${key}[${index}]`,
                        source: entity["@id"],
                        sourceHandle: `${key}`,
                        target,
                        type: "straight"
                    })

                    autoPushHandle(
                        nodes.find((n) => n.id === entity["@id"]),
                        {
                            id: key,
                            name: key
                        }
                    )
                }
            }
        }
    }

    return [nodes, edges]
}

const LayoutFlow = () => {
    const crateData = useContext(CrateDataContext)

    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
    const { fitView } = useReactFlow()

    const { layoutDone, layoutedNodes, layoutedEdges, forceLayout } = useLayout()

    const onConnect = useCallback(
        (params: Edge | Connection) => setEdges((eds) => addEdge({ ...params }, eds)),
        [setEdges]
    )

    const centerView = useCallback(() => {
        fitView({ duration: 200 })
    }, [fitView])

    useEffect(() => {
        if (layoutDone) {
            setNodes([...layoutedNodes])
            setEdges([...layoutedEdges])

            // Hacky but I see no way around
            setTimeout(() => {
                centerView()
            }, 100)
        }
    }, [centerView, layoutDone, layoutedEdges, layoutedNodes, setEdges, setNodes])

    useEffect(() => {
        if (crateData.crateData) {
            const [newNodes, newEdges] = crateToGraph(crateData.crateData)
            setNodes([...newNodes])
            setEdges([...newEdges])
        }
    }, [crateData.crateData, setEdges, setNodes])

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            connectionLineType={ConnectionLineType.SmoothStep}
            nodeTypes={nodeTypes}
            proOptions={{ hideAttribution: true }}
        >
            <Panel position="top-left" className="gap-2 flex items-center">
                <div className="p-0.5 bg-accent rounded-lg">
                    <Button variant="secondary" size="sm">
                        <Rows2 className="w-4 h-4 mr-2" /> Comfortable View
                    </Button>
                    <Button variant="secondary" size="sm">
                        <Rows4 className="w-4 h-4 mr-2" /> Compact View
                    </Button>
                </div>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => centerView()}>
                            <Fullscreen className="w-4 h-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Center View</p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => forceLayout()}>
                            <GitCompare className="w-4 h-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Auto-Layout</p>
                    </TooltipContent>
                </Tooltip>
            </Panel>
            <Background />
        </ReactFlow>
    )
}

const FlowWithProvider = () => {
    return (
        <ReactFlowProvider>
            <LayoutFlow />
        </ReactFlowProvider>
    )
}

export default FlowWithProvider
