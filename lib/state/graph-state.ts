import { applyEdgeChanges, applyNodeChanges, Edge, EdgeChange, Node, NodeChange } from "reactflow"
import { createStore } from "zustand/vanilla"
import { computeGraphLayout } from "@/components/graph/layout"

export interface GraphState {
    nodes: Node[]
    edges: Edge[]
    selectedEntityID: string | undefined
    setSelectedEntityID(fn: (currentID: string | undefined) => string | undefined): void
    updateNodes(nodes: Node[]): void
    autoLayout(): void
    handleNodesChange(changes: NodeChange[]): void
    updateEdges(edges: Edge[]): void
    handleEdgesChange(changes: EdgeChange[]): void
}

export const createGraphState = () =>
    createStore<GraphState>()((set, get) => ({
        edges: [],
        nodes: [],
        selectedEntityID: undefined,
        setSelectedEntityID(fn: (currentID: string | undefined) => string | undefined) {
            const newValue = fn(get().selectedEntityID)
            if (newValue !== get().selectedEntityID) set({ selectedEntityID: newValue })
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
