"use client"

import React, { createRef, useCallback, useContext, useEffect } from "react"
import ReactFlow, {
    Background,
    Connection,
    ConnectionLineType,
    Edge,
    EdgeChange,
    Node,
    NodeChange,
    Panel,
    ReactFlowProvider,
    useNodesInitialized,
    useOnSelectionChange,
    useReactFlow
} from "reactflow"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { EllipsisVertical, Fullscreen, GitCompare, Rows2, Rows4 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { EntityNodeHandle, NEW_PROP_HANDLE } from "@/components/graph/entity-node"
import { isReference, isRoCrateMetadataEntity, toArray } from "@/lib/utils"
import { useEditorState } from "@/lib/state/editor-state"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { nodeTypes } from "@/components/graph/nodes"
import { useGraphStateNoSelector } from "@/components/providers/graph-state-provider"
import { useGraphSettingsNoSelector } from "@/components/providers/graph-settings-provider"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "@/components/ui/context-menu"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { Error } from "@/components/error"
import { Skeleton } from "@/components/ui/skeleton"
import { ActionButton, ActionContextMenuItem } from "@/components/actions/action-buttons"

export const DEFAULT_POS = { x: 0, y: 0 }

function sortByID(a: EntityNodeHandle, b: EntityNodeHandle) {
    if (a.id === b.id) return 0
    return a.id > b.id ? 1 : -1
}

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
            node.data.handles.sort(sortByID)
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
                if (isReference(singleValue) && singleValue["@id"]) {
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
                }

                autoPushHandle(
                    nodes.find((n) => n.id === entity["@id"]),
                    {
                        id: key,
                        name: key,
                        text: !isReference(singleValue)
                    }
                )
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

export function EntityGraph() {
    const entities = useEditorState.useEntities()
    const addProperty = useEditorState.useAddProperty()
    const addPropertyEntry = useEditorState.useAddPropertyEntry()
    const removePropertyEntry = useEditorState.useRemovePropertyEntry()
    const hasUnsavedChanges = useEditorState((store) => store.getHasUnsavedChanges())
    const { showDeleteEntityModal, showAddPropertyModal } = useContext(GlobalModalContext)
    const { saveError, crateDataIsLoading, crateId } = useContext(CrateDataContext)
    const nodesInitialized = useNodesInitialized()

    const {
        nodes,
        updateNodes,
        updateEdges,
        edges,
        handleNodesChange,
        autoLayout,
        handleEdgesChange,
        setSelectedEntityID
    } = useGraphStateNoSelector()

    const {
        showTextProperties,
        setAggregateProperties,
        setShowTextProperties,
        aggregateProperties
    } = useGraphSettingsNoSelector()

    const { fitView } = useReactFlow()

    const contextMenuTriggerRef = createRef<HTMLDivElement>()

    const toggleAggregateProperties = useCallback(() => {
        setAggregateProperties(!aggregateProperties)
    }, [aggregateProperties, setAggregateProperties])

    const toggleShowTextProperties = useCallback(() => {
        setShowTextProperties(!showTextProperties)
    }, [setShowTextProperties, showTextProperties])

    const comfortableView = useCallback(() => {
        setShowTextProperties(true)
        setAggregateProperties(false)
    }, [setAggregateProperties, setShowTextProperties])

    const compactView = useCallback(() => {
        setShowTextProperties(false)
        setAggregateProperties(true)
    }, [setAggregateProperties, setShowTextProperties])

    const handleAddPropertySelect = useCallback(
        (source: IFlatEntity, target: IFlatEntity) => {
            return (propertyName: string) => {
                if (propertyName in source) {
                    addPropertyEntry(source["@id"], propertyName, {
                        "@id": target["@id"]
                    })
                } else {
                    addProperty(source["@id"], propertyName, {
                        "@id": target["@id"]
                    })
                }
            }
        },
        [addProperty, addPropertyEntry]
    )

    const onConnect = useCallback(
        (params: Edge | Connection) => {
            if (!params.source || !params.target || !params.sourceHandle) return
            const source = entities.get(params.source)
            const target = entities.get(params.target)
            if (!source || !target) return

            if (params.sourceHandle === NEW_PROP_HANDLE) {
                showAddPropertyModal(
                    toArray(source["@type"]),
                    handleAddPropertySelect(source, target)
                )
            } else {
                if (!propertyEntryExists(source, params.sourceHandle, params.target)) {
                    addPropertyEntry(params.source, params.sourceHandle, {
                        "@id": params.target
                    })
                }
            }
        },
        [addPropertyEntry, entities, handleAddPropertySelect, showAddPropertyModal]
    )

    const centerView = useCallback(
        (fast?: boolean) => {
            fitView({ duration: fast ? 0 : 200 })
        },
        [fitView]
    )

    const updateNodesFromState = useCallback(() => {
        const [newNodes, newEdges] = entitiesToGraph(entities)
        updateNodes(newNodes)
        updateEdges(newEdges)
    }, [entities, updateEdges, updateNodes])

    useEffect(() => {
        updateNodesFromState()
    }, [updateNodesFromState])

    const beforeNodesChange = useCallback(
        (changes: NodeChange[]) => {
            for (const change of changes) {
                if (change.type === "remove") {
                    showDeleteEntityModal(change.id)
                }
            }
            handleNodesChange(changes.filter((change) => change.type !== "remove"))
        },
        [handleNodesChange, showDeleteEntityModal]
    )

    const beforeEdgesChange = useCallback(
        (changes: EdgeChange[]) => {
            for (const change of changes) {
                if (change.type === "remove") {
                    const deleting = edges.find((edge) => edge.id === change.id)
                    if (deleting && deleting.sourceHandle) {
                        removePropertyEntry(deleting.source, deleting.sourceHandle, {
                            "@id": deleting.target
                        })
                    }
                }
            }
            handleEdgesChange(changes.filter((change) => change.type !== "remove"))
        },
        [edges, handleEdgesChange, removePropertyEntry]
    )

    const backgroundContextMenuHandler = useCallback(
        (e: Event) => {
            if ((e as any).target.querySelector(".react-flow__node") !== null) {
                e.preventDefault()
                contextMenuTriggerRef.current?.dispatchEvent(new MouseEvent("contextmenu", e))
            }
        },
        [contextMenuTriggerRef]
    )

    useEffect(() => {
        const element = document.querySelector(".react-flow__pane")

        if (element) {
            element.addEventListener("contextmenu", backgroundContextMenuHandler)

            return () => element.removeEventListener("contextmenu", backgroundContextMenuHandler)
        }
    }, [backgroundContextMenuHandler])

    const reformat = useCallback(
        (fast?: boolean) => {
            autoLayout()

            setTimeout(() => {
                centerView(fast)
            }, 100)
        },
        [autoLayout, centerView]
    )

    useEffect(() => {
        if (
            nodes.length > 0 &&
            !nodes.find(
                (node) => node.position.x !== DEFAULT_POS.x || node.position.y !== DEFAULT_POS.y
            )
        ) {
            reformat(true)
        }
    }, [nodes, reformat])

    useEffect(() => {
        if (nodesInitialized) {
            centerView(true)
        }
    }, [centerView, nodesInitialized])

    useOnSelectionChange({
        onChange: ({ nodes }) => {
            if (nodes.length === 1 && nodes[0].type === "entityNode") {
                setSelectedEntityID(nodes[0].id)
            } else {
                setSelectedEntityID("")
            }
        }
    })

    return (
        <>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onConnect={onConnect}
                onNodesChange={beforeNodesChange}
                onEdgesChange={beforeEdgesChange}
                connectionLineType={ConnectionLineType.Bezier}
                nodeTypes={nodeTypes}
                deleteKeyCode={["Delete", "Backspace"]}
            >
                <Panel
                    position="top-left"
                    className={`transition gap-2 items-center flex ${crateDataIsLoading || !crateId ? "opacity-0" : "opacity-100"}`}
                >
                    <div className="p-0.5 bg-accent rounded-lg">
                        <Button variant="secondary" size="sm" onClick={comfortableView}>
                            <Rows2 className="w-4 h-4 mr-2" /> Complete View
                        </Button>
                        <Button variant="secondary" size="sm" onClick={compactView}>
                            <Rows4 className="w-4 h-4 mr-2" /> Compact View
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="sm">
                                    <EllipsisVertical className="w-4 h-4 mx-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>Graph Settings</DropdownMenuLabel>
                                <DropdownMenuCheckboxItem
                                    checked={aggregateProperties}
                                    onClick={toggleAggregateProperties}
                                >
                                    Aggregate Properties
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={showTextProperties}
                                    onClick={toggleShowTextProperties}
                                    disabled={aggregateProperties}
                                >
                                    Show Text Properties
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <ActionButton actionId="crate.add-entity" noShortcut variant="outline" />

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
                            <Button variant="outline" size="icon" onClick={() => reformat(false)}>
                                <GitCompare className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Auto-Layout</p>
                        </TooltipContent>
                    </Tooltip>
                </Panel>

                <Panel
                    position="top-right"
                    className={`transition ${crateDataIsLoading || !crateId ? "opacity-0" : "opacity-100"}`}
                >
                    <ActionButton
                        variant={hasUnsavedChanges ? "default" : "secondary"}
                        actionId={"crate.save-all-entities"}
                    />
                </Panel>

                <Panel position="bottom-left">
                    <Error title="Error while saving" error={saveError} />
                </Panel>

                {crateDataIsLoading || !crateId ? (
                    <div className="w-full h-full flex justify-center items-center gap-8">
                        <Skeleton className="w-[200px] h-[100px]" />
                        <div className="space-y-8">
                            <Skeleton className="w-[200px] h-[100px]" />
                            <Skeleton className="w-[200px] h-[100px]" />
                        </div>
                    </div>
                ) : null}

                <Background />

                <ContextMenu>
                    <ContextMenuTrigger>
                        <div ref={contextMenuTriggerRef} />
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                        <ActionContextMenuItem actionId="crate.add-entity" />
                    </ContextMenuContent>
                </ContextMenu>
            </ReactFlow>
        </>
    )
}

export function EntityGraphWithContext() {
    return (
        <ReactFlowProvider>
            <EntityGraph />
        </ReactFlowProvider>
    )
}
