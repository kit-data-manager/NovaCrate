import { applyEdgeChanges, applyNodeChanges, Edge, EdgeChange, Node, NodeChange } from "reactflow"
import { computeGraphLayout } from "@/components/graph/layout"
import { create } from "zustand"
import { unstable_ssrSafe as ssrSafe } from "zustand/middleware"
import { persist } from "zustand/middleware"

export interface GraphViewport {
    x: number
    y: number
    zoom: number
}

export interface GraphState {
    nodes: Node[]
    edges: Edge[]
    selectedEntityID: string | undefined
    viewport: GraphViewport | undefined
    initialFormatDone: boolean
    setSelectedEntityID(id: string): void
    updateNodes(nodes: Node[]): void
    autoLayout(): void
    handleNodesChange(changes: NodeChange[]): void
    updateEdges(edges: Edge[]): void
    handleEdgesChange(changes: EdgeChange[]): void
    setViewport(viewport: GraphViewport): void
    setInitialFormatDone(): void
}

export const useGraphState = create<GraphState>()(
    ssrSafe(
        persist(
            (set, get) => ({
                edges: [],
                nodes: [],
                selectedEntityID: undefined,
                viewport: undefined,
                initialFormatDone: false,
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
                },
                setViewport(viewport: GraphViewport) {
                    set({ viewport })
                },
                setInitialFormatDone() {
                    set({ initialFormatDone: true })
                }
            }),
            {
                name: "graph-state",
                partialize: (state) => ({
                    nodes: state.nodes,
                    viewport: state.viewport,
                    initialFormatDone: state.initialFormatDone
                })
            }
        )
    )
)