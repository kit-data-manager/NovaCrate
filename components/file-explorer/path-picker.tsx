import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import useSWR from "swr"
import { NodeRendererProps, Tree } from "react-arborist"
import {
    ChevronRightIcon,
    FolderIcon,
    FolderPlusIcon,
    PackageIcon,
    RotateCwIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCrateName } from "@/lib/hooks"

type FileTreeNode = { id: string; name: string; children: FileTreeNode[] }

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
        isLoading: isPending,
        mutate: revalidate
    } = useSWR(crateData.crateId ? "files-list-" + crateData.crateId : null, filesListResolver)

    const folders = useMemo(() => {
        return data?.filter((path) => path.endsWith("/")) ?? []
    }, [data])

    const asTree = useMemo(() => {
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

        function toTreeNode(path: string) {
            return { id: path, name: getFolderNameFromPath(path), children: [] }
        }

        return [
            {
                id: "./",
                name: crateName,
                children: folders
                    .filter((f) => f.split("/").length === 2)
                    .map(toTreeNode)
                    .map(associateChildren)
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
            <div className="flex items-center px-2 py-1 border-b bg-muted rounded-t-lg">
                <div className="text-xs border-r pr-3">Save to... </div>
                <Button variant="header" size="sm" onClick={() => revalidate} disabled={isPending}>
                    <RotateCwIcon />
                </Button>
                <Button variant="header" size="sm" disabled={selection === ""}>
                    <FolderPlusIcon />
                </Button>
            </div>
            <div className="p-1">
                <Tree
                    data={asTreeCached}
                    height={200}
                    width={452}
                    rowHeight={28}
                    selectionFollowsFocus={true}
                    disableMultiSelection={true}
                    selection={selection}
                    onSelect={(nodes) =>
                        nodes.length > 0 ? setSelection(nodes[0].id) : setSelection("/")
                    }
                >
                    {Node}
                </Tree>
            </div>
        </div>
    )
}

function getFolderNameFromPath(path: string) {
    const split = path.split("/")
    return split[split.length - 2]
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
                className={`size-4 text-muted-foreground ${node.state.isOpen && "rotate-90"} ${node.children?.length === 0 && "opacity-0"}`}
                onClick={() => node.toggle()}
            />
            {node.id === "./" ? (
                <PackageIcon className="size-4 mr-1" />
            ) : (
                <FolderIcon className="size-4 mr-1" />
            )}
            <span className="select-none">{node.data.name}</span>
        </div>
    )
}
