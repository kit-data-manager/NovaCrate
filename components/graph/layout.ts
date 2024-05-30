import dagre from "dagre"
import { Edge, Node, Position, useNodesInitialized, XYPosition } from "reactflow"
import { useCallback, useEffect, useState } from "react"
import { DEFAULT_POS } from "@/components/graph/entity-graph"

const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

export const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
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

export function useLayout(nodes: Node[], edges: Edge[]) {
    const nodesInitialized = useNodesInitialized()
    const [layoutedNodes, setLayoutedNodes] = useState(nodes)
    const [layoutedEdges, setLayoutedEdges] = useState(edges)

    const doLayout = useCallback(() => {
        const { nodes: layoutNodes, edges: layoutEdges } = getLayoutedElements(nodes, edges)
        setLayoutedNodes(layoutNodes)
        setLayoutedEdges(layoutEdges)
    }, [edges, nodes])

    useEffect(() => {
        if (
            nodesInitialized &&
            nodes.length > 0 &&
            nodes.filter((node) => positionEquals(node.position, DEFAULT_POS)).length ===
                nodes.length
        ) {
            doLayout()
        }
    }, [doLayout, nodes, nodesInitialized])

    return { layoutedNodes, layoutedEdges, doLayout }
}

function positionEquals(a: XYPosition, b: XYPosition) {
    return a.x === b.x && a.y === b.y
}
