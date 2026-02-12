import { applyEdgeChanges, applyNodeChanges, Edge, EdgeChange, Node, NodeChange } from "reactflow"
import { computeGraphLayout } from "@/components/graph/layout"
import { create } from "zustand"
import { unstable_ssrSafe as ssrSafe } from "zustand/middleware"

export interface GraphState {
    nodes: Node[]
    edges: Edge[]
    selectedEntityID: string | undefined
    setSelectedEntityID(id: string): void
    updateNodes(nodes: Node[]): void
    autoLayout(): void
    handleNodesChange(changes: NodeChange[]): void
    updateEdges(edges: Edge[]): void
    handleEdgesChange(changes: EdgeChange[]): void
}

export const useGraphState = create<GraphState>()(
    ssrSafe((set, get) => ({
        edges: [],
        nodes: [],
        selectedEntityID: undefined,
        setSelectedEntityID(id: string) {
            set({ selectedEntityID: id })
        },
        updateNodes(newNodes: Node[]) {
            const nodes: Node[] = []
            for (const newNode of newNodes) {
                const oldNode = get().nodes.find((node) => node.id === newNode.id)
                if (oldNode) {
                    nodes.push({
                        ...newNode,
                        position: oldNode.position
                    })
                } else {
                    nodes.push(newNode)
                }
            }
            set({ nodes })
        },
        autoLayout() {
            set(computeGraphLayout(get().nodes, get().edges))
        },
        handleNodesChange(changes: NodeChange[]) {
            set({ nodes: applyNodeChanges(changes, get().nodes) })
        },
        updateEdges(edges: Edge[]) {
            set({ edges })
        },
        handleEdgesChange(changes: EdgeChange[]) {
            set({ edges: applyEdgeChanges(changes, get().edges) })
        }
    }))
)
