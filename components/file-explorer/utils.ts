export type FileTreeNode = {
    id: string
    name: string
    children: FileTreeNode[]
    type: "folder" | "file"
}

export function getNameFromPath(path: string) {
    const split = path.split("/")
    if (path.endsWith("/")) {
        return split[split.length - 2]
    } else {
        return split[split.length - 1]
    }
}
