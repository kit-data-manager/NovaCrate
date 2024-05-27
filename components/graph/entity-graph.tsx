"use client"

import React, { useCallback, useContext, useEffect, useRef, useState } from "react"
import ReactFlow, {
    applyNodeChanges,
    Background,
    Connection,
    ConnectionLineType,
    Edge,
    Node,
    NodeChange,
    Panel,
    ReactFlowProvider,
    useEdgesState,
    useReactFlow
} from "reactflow"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { Fullscreen, GitCompare, Plus, Rows2, Rows4 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { EntityNodeHandle, NEW_PROP_HANDLE } from "@/components/graph/entity-node"
import { useLayout } from "@/components/graph/layout"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { isReference, isRoCrateMetadataEntity, toArray } from "@/lib/utils"
import { useEditorState } from "@/lib/state/editor-state"
import { AddPropertyModal } from "@/components/editor/add-property-modal"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { nodeTypes } from "@/components/graph/nodes"

const DEFAULT_POS = { x: 0, y: 0 }

function entitiesToGraph(entitiesMap: Map<string, IFlatEntity>): [Node[], Edge[]] {
    const entities = Array.from(entitiesMap.values())
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

    for (const entity of entities) {
        if (isRoCrateMetadataEntity(entity)) continue

        nodes.push({
            id: entity["@id"],
            position: DEFAULT_POS,
            data: {
                entityId: entity["@id"],
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

                    if (!entities.find((n) => n["@id"] === singleValue["@id"])) {
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
                        type: "default"
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

function propertyEntryExists(entity: IFlatEntity, propertyName: string, targetId: string) {
    if (propertyName in entity) {
        const prop = entity[propertyName]
        if (Array.isArray(prop)) {
            for (const entry of prop) {
                if (typeof entry === "object") {
                    if (entry["@id"] === targetId) return true
                }
            }
        } else {
            if (typeof prop === "object") {
                return prop["@id"] === targetId
            }
        }
    }
    return false
}

interface PendingNewProperty {
    source: string
    target: string
}

const LayoutFlow = () => {
    const crateData = useContext(CrateDataContext)
    const entities = useEditorState.useEntities()
    const addProperty = useEditorState.useAddProperty()
    const addPropertyEntry = useEditorState.useAddPropertyEntry()
    const { showCreateEntityModal } = useContext(GlobalModalContext)

    const [nodes, setNodes] = useState<Node[]>([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
    const { fitView } = useReactFlow()
    const [selectPropertyModalOpen, setSelectPropertyModalOpen] = useState(false)
    const [selectPropertyTypeArray, setSelectPropertyTypeArray] = useState<string[]>([])

    const pendingNewProperty = useRef<PendingNewProperty | undefined>(undefined)

    const { layoutDone, layoutedNodes, layoutedEdges, forceLayout } = useLayout()

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => {
            return setNodes(applyNodeChanges(changes, nodes))
        },
        [nodes]
    )

    const onConnect = useCallback(
        (params: Edge | Connection) => {
            if (!params.source || !params.target || !params.sourceHandle) return
            const source = entities.get(params.source)
            const target = entities.get(params.target)
            if (!source || !target) return

            if (params.sourceHandle === NEW_PROP_HANDLE) {
                setSelectPropertyModalOpen(true)
                setSelectPropertyTypeArray(toArray(source["@type"]))
                pendingNewProperty.current = { source: params.source, target: params.target }
                // addProperty(params.source, params.sourceHandle, { "@id": params.target })
            } else {
                if (!propertyEntryExists(source, params.sourceHandle, params.target)) {
                    addPropertyEntry(params.source, params.sourceHandle, {
                        "@id": params.target
                    })
                }
            }
        },
        [addPropertyEntry, entities]
    )

    const onEdgesDelete = useCallback((edges: Edge[]) => {
        // TODO do something
    }, [])

    const onPropertySelectOpenChange = useCallback((isOpen: boolean) => {
        setSelectPropertyModalOpen(isOpen)
    }, [])

    const handlePropertySelect = useCallback(
        (propertyName: string) => {
            if (pendingNewProperty.current) {
                addProperty(pendingNewProperty.current.source, propertyName, {
                    "@id": pendingNewProperty.current.target
                })
            } else console.warn("Failed to add property, no pending property select")
        },
        [addProperty]
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
        const [newNodes, newEdges] = entitiesToGraph(entities)
        console.log("New entities", newNodes)
        setNodes((oldNodes) => {
            const nodes: Node[] = []
            for (const newNode of newNodes) {
                const oldNode = oldNodes.find((node) => node.id === newNode.id)
                if (oldNode) {
                    nodes.push({
                        ...newNode,
                        position: oldNode.position
                    })
                } else {
                    nodes.push(newNode)
                }
            }
            return nodes
        })
        setEdges([...newEdges])
    }, [crateData.crateData, entities, setEdges, setNodes])

    return (
        <>
            <AddPropertyModal
                open={selectPropertyModalOpen}
                onPropertyAdd={handlePropertySelect}
                onOpenChange={onPropertySelectOpenChange}
                typeArray={selectPropertyTypeArray}
            />
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onEdgesDelete={onEdgesDelete}
                onConnect={onConnect}
                connectionLineType={ConnectionLineType.Bezier}
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

                    <Button variant="outline" onClick={() => showCreateEntityModal()}>
                        <Plus className="w-4 h-4 shrink-0 mr-2" /> New
                    </Button>

                    <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => centerView()}>
                                <Fullscreen className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Center View</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip delayDuration={200}>
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
        </>
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
