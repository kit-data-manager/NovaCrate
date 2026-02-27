"use client"

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import {
    ChevronRightIcon,
    ChevronsDownUp,
    ChevronsUpDown,
    EllipsisVertical,
    FileIcon,
    Folder,
    FolderIcon,
    PackageIcon,
    RefreshCw
} from "lucide-react"
import { Error } from "@/components/error"
import HelpTooltip from "@/components/help-tooltip"
import { useFileExplorerState } from "@/lib/state/file-explorer-state"
import { editorState, useEditorState } from "@/lib/state/editor-state"
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
import { useCrateName, useGoToEntityEditor } from "@/lib/hooks"
import { NodeRendererProps, Tree, TreeApi } from "react-arborist"
import { Input } from "@/components/ui/input"
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu"
import { EntryContextMenu } from "@/components/file-explorer/entry-context-menu"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { getEntityDisplayName } from "@/lib/utils"

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
    const { showDeleteEntityModal } = useContext(GlobalModalContext)

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
        revalidateRef.current()
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
                        .map(associateChildren) ?? [],
                type: "folder"
            }
        ]
    }, [crateName, data])

    const asTreeCache = useRef<FileTreeNode[]>([])
    const asTreeCached = useMemo(() => {
        if (JSON.stringify(asTreeCache.current) === JSON.stringify(asTree))
            return asTreeCache.current
        else {
            asTreeCache.current = asTree
            return asTreeCache.current
        }
    }, [asTree])

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

    const setPreviewingFilePath = useFileExplorerState((store) => store.setPreviewingFilePath)

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
                            onMove={(n) => console.log("move", n)} /* TODO: move and rename */
                            onRename={(n) => console.log("rename", n)}
                            onSelect={(node) =>
                                node.length === 1
                                    ? node[0].data.id !== "./" &&
                                      node[0].data.type === "file" &&
                                      setPreviewingFilePath(node[0].data.id)
                                    : null
                            }
                        >
                            {Node}
                        </Tree>
                    </div>
                </ContextMenuTrigger>
                <EntryContextMenu blankSpace={true} />
            </ContextMenu>
        </div>
    )
}

function Node({ node, style, dragHandle }: NodeRendererProps<FileTreeNode>) {
    const [renameValue, setRenameValue] = useState(node.data.name)
    const entity = useStore(
        editorState,
        (s) => s.getEntities().get(node.data.id) || s.getEntities().get("./" + node.data.id)
    )
    const goToEntity = useGoToEntityEditor(entity)
    const showEntities = useStore(fileExplorerSettings, (s) => s.showEntities)

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div
                    ref={node.state.isEditing ? undefined : dragHandle}
                    style={style}
                    className={`flex items-center gap-1 ${node.state.isSelected && "bg-muted"} ${node.state.isSelectedEnd && "rounded-b-sm"} ${node.state.isSelectedStart && "rounded-t-sm"} p-1 outline-hidden`}
                    onDoubleClick={() => {
                        if (entity) goToEntity()
                    }}
                >
                    <ChevronRightIcon
                        className={`size-4 text-muted-foreground ${node.state.isOpen && "rotate-90"} ${!node.id.endsWith("/") && "opacity-0"} shrink-0 mr-1`}
                        onClick={() => node.toggle()}
                    />
                    {showEntities && entity ? (
                        <EntityIcon entity={entity} className="shrink-0 mr-0.75" size="sm" />
                    ) : node.id === "./" ? (
                        <PackageIcon className="size-4 mr-1 shrink-0" />
                    ) : node.data.type === "file" ? (
                        <FileIcon className="size-4 mr-1 shrink-0" />
                    ) : (
                        <FolderIcon className="size-4 mr-1 shrink-0" />
                    )}
                    {node.state.isEditing ? (
                        <Input
                            className="p-1 h-6"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            autoFocus={true}
                            onKeyDown={(e) => e.key === "Enter" && node.submit(renameValue)}
                            onBlur={() => node.reset()}
                        />
                    ) : (
                        <span className="select-none line-clamp-1">
                            {showEntities && entity ? getEntityDisplayName(entity) : node.data.name}
                        </span>
                    )}
                </div>
            </ContextMenuTrigger>
            <EntryContextMenu
                entity={entity}
                folder={node.data.type === "folder"}
                filePath={node.data.id}
                fileName={node.data.name}
                goToEntity={goToEntity}
                blankSpace={false}
                rename={() =>
                    setTimeout(() => {
                        node.edit()
                    }, 300)
                }
            />
        </ContextMenu>
    )
}
