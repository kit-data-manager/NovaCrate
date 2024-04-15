"use client"

import React, { useCallback, useEffect, useState } from "react"
import ReactFlow, {
    addEdge,
    Background,
    Connection,
    ConnectionLineType,
    Edge,
    Handle,
    Node,
    Panel,
    Position,
    ReactFlowProvider,
    useEdgesState,
    useNodesInitialized,
    useNodesState,
    useReactFlow
} from "reactflow"
import dagre from "dagre"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { EllipsisVertical, GitCompare, Rows2, Rows4 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const position = { x: 0, y: 0 }
const edgeType = "default"

const nodeTypes = {
    customNode: CustomNode
}

function CustomNode({ data, isConnectable }: { data: { name: string }; isConnectable: boolean }) {
    return (
        <>
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: "#555" }}
                onConnect={(params) => console.log("handle onConnect", params)}
                isConnectable={isConnectable}
            />
            <div className="p-4 rounded border border-accent bg-background">
                <div className="flex gap-4 items-center">
                    <div className="p-0.5 border rounded-sm border-file text-file aspect-square w-8 h-8 text-center">
                        F
                    </div>

                    <div className="flex flex-col">
                        <span>{data.name}</span>
                        <span className="text-muted-foreground text-sm">/some-local-data</span>
                    </div>

                    <Button size="icon" variant="ghost">
                        <EllipsisVertical />
                    </Button>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Right}
                style={{ background: "#555" }}
                isConnectable={isConnectable}
            />
        </>
    )
}

const initialNodes = [
    {
        id: "1",
        type: "customNode",
        data: { name: "The Entity with the very long name" },
        position
    },
    {
        id: "2",
        type: "customNode",
        data: { name: "Some Entity" },
        position
    },
    {
        id: "3",
        type: "customNode",
        data: { name: "Some new Entity" },
        position
    }
]

const initialEdges = [
    { id: "e12", source: "1", target: "2", type: edgeType, animated: false },
    { id: "e13", source: "1", target: "3", type: edgeType, animated: false }
]

const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    dagreGraph.setGraph({ rankdir: "LR" })

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: node.width || 100, height: node.height || 40 })
    })

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target)
    })

    dagre.layout(dagreGraph)

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id)
        node.targetPosition = Position.Left
        node.sourcePosition = Position.Right

        // We are shifting the dagre node position (anchor=center) to the top left,
        // so it matches the React Flow node anchor point (top left).
        if (node.width && node.height)
            node.position = {
                x: nodeWithPosition.x - node.width / 2,
                y: nodeWithPosition.y - node.height / 2
            }

        return node
    })

    return { nodes, edges }
}

const { nodes: initialLayoutedNodes, edges: initialLayoutedEdges } = getLayoutedElements(
    initialNodes,
    initialEdges
)

function useLayout() {
    const { getNodes, getEdges } = useReactFlow()
    const nodesInitialized = useNodesInitialized()
    const [layoutedNodes, setLayoutedNodes] = useState(getNodes())
    const [layoutedEdges, setLayoutedEdges] = useState(getEdges())

    const doLayout = useCallback(() => {
        const { nodes, edges } = getLayoutedElements(getNodes(), getEdges())
        setLayoutedNodes(nodes)
        setLayoutedEdges(edges)
    }, [getEdges, getNodes])

    useEffect(() => {
        if (nodesInitialized) {
            doLayout()
        }
    }, [doLayout, getEdges, getNodes, nodesInitialized])

    return { layoutDone: nodesInitialized, layoutedNodes, layoutedEdges, forceLayout: doLayout }
}

const LayoutFlow = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialLayoutedNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialLayoutedEdges)
    const { fitView } = useReactFlow()

    const { layoutDone, layoutedNodes, layoutedEdges, forceLayout } = useLayout()

    const onConnect = useCallback(
        (params: Edge | Connection) => setEdges((eds) => addEdge({ ...params }, eds)),
        [setEdges]
    )

    useEffect(() => {
        if (layoutDone) {
            setNodes([...layoutedNodes])
            setEdges([...layoutedEdges])
            fitView({ nodes: layoutedNodes })
        }
    }, [fitView, layoutDone, layoutedEdges, layoutedNodes, setEdges, setNodes])

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
                        <Button variant="outline" size="icon" onClick={() => forceLayout()}>
                            <GitCompare className="w-4 h-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Apply Layout</p>
                    </TooltipContent>
                </Tooltip>
            </Panel>
            <Background />
            {/*<Controls />*/}
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
