"use client"

import React, { useCallback } from "react"
import ReactFlow, {
    addEdge,
    Background,
    Connection,
    ConnectionLineType,
    Controls,
    Edge,
    Handle,
    Node,
    Panel,
    Position,
    useEdgesState,
    useNodesState
} from "reactflow"
import dagre from "dagre"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { Ellipsis, EllipsisVertical } from "lucide-react"

const position = { x: 0, y: 0 }
const edgeType = "smoothstep"

const nodeTypes = {
    customNode: CustomNode
}

function CustomNode({ data, isConnectable }: { data: unknown; isConnectable: boolean }) {
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
                        <span>Some Entity</span>
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
        data: {},
        position
    },
    {
        id: "2",
        type: "customNode",
        data: {},
        position
    }
]

const initialEdges = [{ id: "e12", source: "1", target: "2", type: edgeType, animated: false }]

const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

const nodeWidth = 172
const nodeHeight = 36

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction: "TB" | "LR" = "TB") => {
    const isHorizontal = direction === "LR"
    dagreGraph.setGraph({ rankdir: direction })

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
    })

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target)
    })

    dagre.layout(dagreGraph)

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id)
        node.targetPosition = isHorizontal ? Position.Left : Position.Top
        node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom

        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow node anchor point (top left).
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2
        }

        return node
    })

    return { nodes, edges }
}

const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
    initialNodes,
    initialEdges
)

const LayoutFlow = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)

    const onConnect = useCallback(
        (params: Edge | Connection) =>
            setEdges((eds) =>
                addEdge({ ...params, type: ConnectionLineType.SmoothStep, animated: true }, eds)
            ),
        [setEdges]
    )
    const onLayout = useCallback(
        (direction: "TB" | "LR") => {
            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                nodes,
                edges,
                direction
            )

            setNodes([...layoutedNodes])
            setEdges([...layoutedEdges])
        },
        [nodes, edges, setNodes, setEdges]
    )

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            connectionLineType={ConnectionLineType.SmoothStep}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
        >
            {/*<Panel position="top-right">*/}
            {/*    <Button variant="outline" onClick={() => onLayout("TB")}>*/}
            {/*        vertical layout*/}
            {/*    </Button>*/}
            {/*    <Button variant="outline" onClick={() => onLayout("LR")}>*/}
            {/*        horizontal layout*/}
            {/*    </Button>*/}
            {/*</Panel>*/}
            <Background />
            {/*<Controls />*/}
        </ReactFlow>
    )
}

export default LayoutFlow
