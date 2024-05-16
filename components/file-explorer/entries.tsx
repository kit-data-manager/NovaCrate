import { useEditorState } from "@/components/editor-state"
import { useCallback, useMemo, useState } from "react"
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown, File, FileX, Folder, FolderX } from "lucide-react"
import { getEntityDisplayName, isFileDataEntity } from "@/lib/utils"
import { EntryContextMenu } from "@/components/file-explorer/entry-context-menu"
import { FolderContent } from "@/components/file-explorer/content"

function isNonEmptyPart(part: string) {
    return part !== "" && part !== "."
}

function entityDisplayNameFileExplorer(entity: IFlatEntity) {
    const parts = entity["@id"].split("/").filter(isNonEmptyPart)
    return parts[parts.length - 1] || entity["@id"]
}

function filePathLastSegment(filePath: string) {
    const split = filePath.split("/").filter((part) => part !== "")
    return split[split.length - 1]
}

export function FolderEntry(props: { filePath: string; filePaths: string[] }) {
    const entity = useEditorState((state) => state.entities.get(props.filePath))
    const [isOpen, setIsOpen] = useState(true)

    const isMock = useMemo(() => {
        return entity == undefined
    }, [entity])

    const toggleOpen = useCallback(() => {
        setIsOpen(!isOpen)
    }, [isOpen])

    return (
        <>
            <ContextMenu>
                <ContextMenuTrigger>
                    <Button
                        className={`gap-2 group/fileBrowserEntry w-full pl-1`}
                        variant="list-entry"
                        onClick={() => toggleOpen()}
                    >
                        <ChevronDown
                            className="w-4 h-4 text-foreground shrink-0 aria-disabled:-rotate-90"
                            aria-disabled={!isOpen}
                        />
                        {isMock ? (
                            <FolderX className="w-4 h-4 text-muted-foreground shrink-0" />
                        ) : (
                            <Folder className="w-4 h-4 shrink-0" />
                        )}

                        <div className="truncate">
                            <span
                                className={`group-hover/fileBrowserEntry:underline ${isMock ? "text-muted-foreground" : ""}`}
                            >
                                {entity
                                    ? entityDisplayNameFileExplorer(entity)
                                    : filePathLastSegment(props.filePath)}
                            </span>
                            <span className="text-sm text-muted-foreground ml-2">
                                {entity ? getEntityDisplayName(entity, false) : ""}
                            </span>
                        </div>
                    </Button>
                </ContextMenuTrigger>
                <EntryContextMenu entity={entity} folder />
            </ContextMenu>
            {isOpen ? (
                <div className="ml-6">
                    <FolderContent path={props.filePath} filePaths={props.filePaths} />
                </div>
            ) : null}
        </>
    )
}

export function FileEntry(props: { filePath: string }) {
    const entity = useEditorState((state) => state.entities.get(props.filePath))
    const [isOpen, setIsOpen] = useState(true)

    const isFile = useMemo(() => {
        return entity ? isFileDataEntity(entity) : false
    }, [entity])

    const isMock = useMemo(() => {
        return entity == undefined
    }, [entity])

    const toggleOpen = useCallback(() => {
        if (!isFile) setIsOpen(!isOpen)
    }, [isFile, isOpen])

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <Button
                    className={`gap-2 group/fileBrowserEntry w-full pl-1`}
                    variant="list-entry"
                    onClick={() => toggleOpen()}
                >
                    <div className="w-4 h-4 shrink-0" />
                    {isMock ? (
                        <FileX className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                        <File className="w-4 h-4 shrink-0" />
                    )}

                    <div className="truncate">
                        <span
                            className={`group-hover/fileBrowserEntry:underline ${isMock ? "text-muted-foreground" : ""}`}
                        >
                            {entity
                                ? entityDisplayNameFileExplorer(entity)
                                : filePathLastSegment(props.filePath)}
                        </span>
                        <span className="text-sm text-muted-foreground ml-2">
                            {entity ? getEntityDisplayName(entity, false) : ""}
                        </span>
                    </div>
                </Button>
            </ContextMenuTrigger>
            <EntryContextMenu entity={entity} />
        </ContextMenu>
    )
}
