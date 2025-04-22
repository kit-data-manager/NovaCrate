import { useEditorState } from "@/lib/state/editor-state"
import { useCallback, useEffect, useMemo, useState } from "react"
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown, Eye, File, FileX, Folder, FolderX } from "lucide-react"
import { encodeFilePath, getEntityDisplayName } from "@/lib/utils"
import { EntryContextMenu } from "@/components/file-explorer/entry-context-menu"
import { FolderContent } from "@/components/file-explorer/content"
import { DefaultSectionOpen } from "@/components/file-explorer/explorer"
import { useGoToEntityEditor } from "@/lib/hooks"
import { useFileExplorerState } from "@/lib/state/file-explorer-state"

function isNonEmptyPart(part: string) {
    return part !== "" && part !== "."
}

function entityDisplayNameFileExplorer(entity: IEntity) {
    const parts = entity["@id"].split("/").filter(isNonEmptyPart)
    return parts[parts.length - 1] || entity["@id"]
}

function filePathLastSegment(filePath: string) {
    const split = filePath.split("/").filter((part) => part !== "")
    return split[split.length - 1]
}

export function FolderEntry(props: {
    filePath: string
    filePaths: string[]
    defaultSectionOpen: DefaultSectionOpen
    onSectionOpenChange(): void
}) {
    const entity = useEditorState((state) => state.entities.get(encodeFilePath(props.filePath)))
    const [isOpen, setIsOpen] = useState(
        props.defaultSectionOpen !== "indeterminate" ? props.defaultSectionOpen : false
    )
    const goToEntity = useGoToEntityEditor(entity)

    useEffect(() => {
        if (props.defaultSectionOpen !== "indeterminate") setIsOpen(props.defaultSectionOpen)
    }, [props.defaultSectionOpen])

    const toggle = useCallback(() => {
        setIsOpen(!isOpen)
        props.onSectionOpenChange()
    }, [isOpen, props])

    const isMock = useMemo(() => {
        return entity == undefined
    }, [entity])

    return (
        <>
            <ContextMenu>
                <ContextMenuTrigger>
                    <Button
                        className={`gap-2 group/fileBrowserEntry w-full pl-1`}
                        variant="list-entry"
                        onClick={() => toggle()}
                    >
                        <ChevronDown
                            className="size-4 text-foreground shrink-0 aria-disabled:-rotate-90"
                            aria-disabled={!isOpen}
                        />
                        {isMock ? (
                            <FolderX className="size-4 text-muted-foreground shrink-0" />
                        ) : (
                            <Folder className="size-4 shrink-0" />
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
                <EntryContextMenu
                    entity={entity}
                    folder
                    filePath={props.filePath}
                    fileName={filePathLastSegment(props.filePath)}
                    goToEntity={goToEntity}
                />
            </ContextMenu>
            {isOpen ? (
                <div className="ml-6">
                    <FolderContent
                        path={props.filePath}
                        filePaths={props.filePaths}
                        defaultSectionOpen={props.defaultSectionOpen}
                        onSectionOpenChange={props.onSectionOpenChange}
                    />
                </div>
            ) : null}
        </>
    )
}

export function FileEntry(props: { filePath: string }) {
    const entity = useEditorState((state) => state.entities.get(props.filePath))
    const setPreviewingFilePath = useFileExplorerState((store) => store.setPreviewingFilePath)
    const previewingFilePath = useFileExplorerState((store) => store.previewingFilePath)
    const goToEntity = useGoToEntityEditor(entity)

    const isMock = useMemo(() => {
        return entity == undefined
    }, [entity])

    const isBeingPreviewed = useMemo(() => {
        return previewingFilePath === props.filePath
    }, [previewingFilePath, props.filePath])

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <Button
                    className={`gap-2 group/fileBrowserEntry w-full pl-1`}
                    variant="list-entry"
                    onClick={() => setPreviewingFilePath(props.filePath)}
                >
                    <div className="size-4 shrink-0" />
                    {isMock ? (
                        <FileX className="size-4 text-muted-foreground shrink-0" />
                    ) : (
                        <File className="size-4 shrink-0" />
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
                    {isBeingPreviewed ? <Eye className="size-4 ml-2 shrink-0" /> : null}
                </Button>
            </ContextMenuTrigger>
            <EntryContextMenu
                entity={entity}
                filePath={props.filePath}
                fileName={filePathLastSegment(props.filePath)}
                goToEntity={goToEntity}
            />
        </ContextMenu>
    )
}
