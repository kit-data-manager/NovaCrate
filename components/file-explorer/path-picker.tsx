import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import useSWR from "swr"
import { NodeRendererProps, Tree } from "react-arborist"
import { ChevronRightIcon, FolderIcon, LoaderCircleIcon, PackageIcon } from "lucide-react"
import { useCrateName } from "@/lib/hooks"
import { Error } from "@/components/error"
import { FileTreeNode, getNameFromPath } from "@/components/file-explorer/utils"

export function PathPicker({
    onPathPicked,
    defaultPath = "./"
}: {
    onPathPicked: (path: string) => void
    defaultPath?: string
}) {
    const crateData = useContext(CrateDataContext)
    const crateName = useCrateName()
    const [selection, setSelection] = useState<string>(defaultPath)

    useEffect(() => {
        onPathPicked(selection)
    }, [onPathPicked, selection])

    const filesListResolver = useCallback(async () => {
        if (crateData.serviceProvider && crateData.crateId) {
            return await crateData.serviceProvider.getCrateFilesList(crateData.crateId)
        }
    }, [crateData.crateId, crateData.serviceProvider])

    const {
        data,
        error,
        isLoading: isPending
    } = useSWR(crateData.crateId ? "files-list-" + crateData.crateId : null, filesListResolver)

    const folders = useMemo(() => {
        return data?.filter((path) => path.endsWith("/")) ?? []
    }, [data])

    const asTree = useMemo((): FileTreeNode[] => {
        function associateChildren(node: FileTreeNode) {
            const children = folders.filter((f) => {
                const rightDepth = f.split("/").length === node.id.split("/").length + 1
                const rightParent = f.startsWith(node.id)
                return rightDepth && rightParent
            })
            node.children = children.map(toTreeNode)
            node.children.forEach(associateChildren)
            return node
        }

        function toTreeNode(path: string): FileTreeNode {
            return { id: path, name: getNameFromPath(path), children: [], type: "folder" }
        }

        return [
            {
                id: "./",
                name: crateName,
                children: folders
                    .filter((f) => f.split("/").length === 2)
                    .map(toTreeNode)
                    .map(associateChildren),
                type: "folder"
            }
        ]
    }, [crateName, folders])

    const asTreeCache = useRef<FileTreeNode[]>([])
    const asTreeCached = useMemo(() => {
        if (JSON.stringify(asTreeCache.current) === JSON.stringify(asTree))
            return asTreeCache.current
        else {
            asTreeCache.current = asTree
            return asTreeCache.current
        }
    }, [asTree])

    return (
        <div className="border rounded-lg">
            <div className="p-1">
                <Error error={error} title="Failed to fetch files list" />
                {isPending ? (
                    <div className="flex justify-center items-center h-50">
                        <LoaderCircleIcon className="size-4 animate-spin" />
                    </div>
                ) : (
                    <Tree
                        data={asTreeCached}
                        height={200}
                        width={452}
                        rowHeight={28}
                        selectionFollowsFocus={true}
                        disableMultiSelection={true}
                        selection={selection}
                        onSelect={(nodes) =>
                            nodes.length > 0 ? setSelection(nodes[0].id) : setSelection("./")
                        }
                    >
                        {Node}
                    </Tree>
                )}
            </div>
        </div>
    )
}

function Node({ node, style }: NodeRendererProps<FileTreeNode>) {
    return (
        <div
            style={style}
            className={`flex items-center gap-1 ${node.state.isSelected && "bg-muted"} rounded-sm text-sm p-1`}
            onClick={() => node.select()}
            onDoubleClick={() => node.toggle()}
        >
            <ChevronRightIcon
                className={`size-4 text-muted-foreground ${node.state.isOpen && "rotate-90"} ${node.children?.length === 0 && "opacity-0"} shrink-0`}
                onClick={() => node.toggle()}
            />
            {node.id === "./" ? (
                <PackageIcon className="size-4 mr-1 shrink-0" />
            ) : (
                <FolderIcon className="size-4 mr-1 shrink-0" />
            )}
            <span className="select-none line-clamp-1">{node.data.name}</span>
        </div>
    )
}
