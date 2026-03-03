"use client"

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { ChevronsDownUp, ChevronsUpDown, EllipsisVertical, Folder, RefreshCw } from "lucide-react"
import { Error } from "@/components/error"
import HelpTooltip from "@/components/help-tooltip"
import { useFileExplorerState } from "@/lib/state/file-explorer-state"
import { useEditorState } from "@/lib/state/editor-state"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { ActionButton } from "@/components/actions/action-buttons"
import { Button } from "@/components/ui/button"
import useSWR from "swr"
import { useStore } from "zustand"
import { fileExplorerSettings } from "@/lib/state/file-explorer-settings"
import { EntityIcon } from "@/components/entity/entity-icon"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { FileTreeNode, getNameFromPath } from "@/components/file-explorer/utils"
import { useCrateName } from "@/lib/hooks"
import { MoveHandler, RenameHandler, Tree, TreeApi } from "react-arborist"
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu"
import { EntryContextMenu } from "@/components/file-explorer/entry-context-menu"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { getFileName, normalizeIdentifier } from "@/lib/utils"
import { ExplorerNode } from "@/components/file-explorer/explorer-node"

export type DefaultSectionOpen = boolean | "indeterminate"

export function FileExplorer() {
    const crateData = useContext(CrateDataContext)
    const entities = useEditorState((store) => store.entities)
    const downloadError = useFileExplorerState((store) => store.downloadError)
    const showEntities = useStore(fileExplorerSettings, (s) => s.showEntities)
    const toggleShowEntities = useStore(fileExplorerSettings, (s) => s.toggleShowEntities)
    const crateName = useCrateName()
    const treeParent = useRef<HTMLDivElement>(null)
    const treeRef = useRef<TreeApi<FileTreeNode>>(null)
    const { showDeleteEntityModal, showMultiRenameModal } = useContext(GlobalModalContext)

    const [treeSize, setTreeSize] = useState<{ width: number; height: number }>({
        width: 10,
        height: 10
    })

    const filesListResolver = useCallback(async () => {
        if (crateData.serviceProvider && crateData.crateId) {
            return await crateData.serviceProvider.getCrateFilesList(crateData.crateId)
        }
    }, [crateData.crateId, crateData.serviceProvider])

    const {
        data,
        error,
        isLoading: isPending,
        mutate: revalidate
    } = useSWR(crateData.crateId ? "files-list-" + crateData.crateId : null, filesListResolver)

    const revalidateRef = useRef(revalidate)
    useEffect(() => {
        revalidateRef.current = revalidate
    }, [revalidate])

    useEffect(() => {
        // Whenever the entities change, reload the files list
        revalidateRef.current().then()
    }, [entities])

    const collapseAllSections = useCallback(() => {
        treeRef.current?.closeAll()
    }, [])

    const expandAllSections = useCallback(() => {
        treeRef.current?.openAll()
    }, [])

    const asTree = useMemo((): FileTreeNode[] => {
        function associateChildren(node: FileTreeNode) {
            const children =
                data?.filter((f) => {
                    const rightDepth = f.endsWith("/")
                        ? f.split("/").length === node.id.split("/").length + 1
                        : f.split("/").length === node.id.split("/").length
                    const rightParent = f.startsWith(node.id)
                    return rightDepth && rightParent
                }) ?? []
            if (node.id.endsWith("/")) {
                node.children = children.map(toTreeNode)
                node.children.forEach(associateChildren)
            }
            node.children.sort((a, b) => a.id.localeCompare(b.id))
            return node
        }

        function toTreeNode(path: string): FileTreeNode {
            return {
                id: path,
                name: getNameFromPath(path),
                children: [],
                type: path.endsWith("/") ? "folder" : "file"
            }
        }

        return [
            {
                id: "./",
                name: crateName,
                children:
                    data
                        ?.filter((f) =>
                            f.endsWith("/") ? f.split("/").length === 2 : f.split("/").length === 1
                        )
                        .map(toTreeNode)
                        .map(associateChildren)
                        .sort((a, b) => a.id.localeCompare(b.id)) ?? [],
                type: "folder" as const
            }
        ]
    }, [crateName, data])

    const [asTreeCached, setAsTreeCached] = useState(asTree)
    if (JSON.stringify(asTreeCached) !== JSON.stringify(asTree)) {
        setAsTreeCached(asTree)
    }

    useEffect(() => {
        if (treeParent.current) {
            const observer = new ResizeObserver((entries) => {
                const relevantEntry = entries[0]
                setTreeSize({
                    width: relevantEntry.contentRect.width,
                    height: relevantEntry.contentRect.height
                })
            })
            observer.observe(treeParent.current)

            const lastElement = treeParent.current
            return () => observer.unobserve(lastElement)
        }
    }, [])

    const onMoveHandler: MoveHandler<FileTreeNode> = useCallback(
        (n) => {
            if (n.parentId === null) return

            const changes = n.dragIds
                .map((affected) => ({
                    from: affected,
                    to: n.parentId + getFileName(affected) + (affected.endsWith("/") ? "/" : "")
                }))
                .filter(
                    (change) => normalizeIdentifier(change.to) !== normalizeIdentifier(change.from)
                )

            if (changes.length > 0) {
                setTimeout(() => {
                    showMultiRenameModal(changes, () => revalidate())
                }, 100)
            }
        },
        [revalidate, showMultiRenameModal]
    )

    const onRenameHandler: RenameHandler<FileTreeNode> = useCallback(
        (n) => {
            const split = n.id.split("/")
            if (n.id.endsWith("/")) {
                split[split.length - 2] = n.name
            } else {
                split[split.length - 1] = n.name
            }
            const result = split.join("/")

            if (normalizeIdentifier(n.id) !== normalizeIdentifier(result)) {
                setTimeout(() => {
                    showMultiRenameModal([{ from: n.id, to: result }], () => revalidate())
                }, 100)
            }
        },
        [revalidate, showMultiRenameModal]
    )

    return (
        <div className="flex flex-col h-full bg-background rounded-lg overflow-hidden border">
            <div className="pl-4 pr-2 border-b text-sm h-10 flex items-center gap-2 truncate shrink-0 bg-accent">
                <Folder className="size-4 shrink-0" /> File Explorer
                <HelpTooltip>
                    <div>
                        <div className="text-wrap">
                            The File Explorer lists all files and folders in the RO-Crate.
                        </div>
                        <div className="mt-6">
                            <b>Double-Left-Click:</b> Edit/Create Data Entity
                        </div>
                        <div>
                            <b>Left-Click:</b> Preview File Content (only supported for some file
                            types)
                        </div>
                        <div>
                            <b>Right-Click:</b> More Options
                        </div>
                    </div>
                </HelpTooltip>
                <div className="grow" />
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            id="toggle-show-entities"
                            variant="outline"
                            size="sm"
                            className={`px-0`}
                            onClick={toggleShowEntities}
                        >
                            <EntityIcon
                                className={`ml-2  ${showEntities ? "" : "grayscale"}`}
                                entity={{ "@id": "", "@type": "File" }}
                            />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Show entities next to file names</TooltipContent>
                </Tooltip>
                <ActionButton
                    variant="outline"
                    className="text-xs"
                    size={"sm"}
                    noShortcut
                    actionId={"crate.add-entity"}
                />
                <DropdownMenu>
                    <DropdownMenuTrigger className="px-1" asChild>
                        <Button variant="outline" size="sm">
                            <EllipsisVertical className="size-4 shrink-0" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>File Explorer Settings</DropdownMenuLabel>
                        <DropdownMenuItem onClick={collapseAllSections}>
                            <ChevronsDownUp className={"size-4 mr-2"} /> Collapse All
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={expandAllSections}>
                            <ChevronsUpDown className={"size-4 mr-2"} /> Expand All
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled={isPending} onClick={() => revalidate()}>
                            <RefreshCw
                                className={`size-4 mr-2 ${isPending ? "animate-spin" : ""}`}
                            />{" "}
                            Reload
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <Error error={error} title="Failed to fetch files list" />
            <Error error={downloadError} title="Download failed" />
            <ContextMenu>
                <ContextMenuTrigger asChild>
                    <div className="p-2 overflow-y-auto grow" ref={treeParent}>
                        <Tree
                            ref={treeRef}
                            data={asTreeCached}
                            height={treeSize.height}
                            width={treeSize.width}
                            rowHeight={32}
                            selectionFollowsFocus={true}
                            disableDrag={(node) => node.id === "./"}
                            disableDrop={(args) => args.parentNode.data.type === "file"}
                            onDelete={(n) => {
                                n.ids.length === 1 && showDeleteEntityModal(n.ids[0])
                                return
                            }}
                            onMove={onMoveHandler}
                            onRename={onRenameHandler}
                        >
                            {ExplorerNode}
                        </Tree>
                    </div>
                </ContextMenuTrigger>
                <EntryContextMenu blankSpace={true} />
            </ContextMenu>
        </div>
    )
}
