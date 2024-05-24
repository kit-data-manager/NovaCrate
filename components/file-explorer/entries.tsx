import { useEditorState } from "@/lib/state/editor-state"
import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown, Eye, File, FileX, Folder, FolderX } from "lucide-react"
import { encodeFilePath, getEntityDisplayName } from "@/lib/utils"
import { EntryContextMenu } from "@/components/file-explorer/entry-context-menu"
import { FolderContent } from "@/components/file-explorer/content"
import { FileExplorerContext } from "@/components/file-explorer/context"
import { DefaultSectionOpen } from "@/components/file-explorer/explorer"
import {
    createEntityEditorTab,
    EntityEditorTabsContext
} from "@/components/providers/entity-tabs-provider"
import { usePathname, useRouter } from "next/navigation"

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

function useGoToEntity(entity?: IFlatEntity) {
    const pathname = usePathname()
    const router = useRouter()
    const { openTab } = useContext(EntityEditorTabsContext)

    return useCallback(() => {
        if (entity) {
            openTab(createEntityEditorTab(entity), true)
        }

        const href =
            pathname
                .split("/")
                .filter((_, i) => i < 3)
                .join("/") + "/entities"
        router.push(href)
    }, [entity, openTab, pathname, router])
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
    const goToEntity = useGoToEntity(entity)

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
                        onDoubleClick={goToEntity}
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
    const { setPreviewingFilePath, previewingFilePath } = useContext(FileExplorerContext)
    const goToEntity = useGoToEntity(entity)

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
                    onDoubleClick={goToEntity}
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
                    {isBeingPreviewed ? <Eye className="w-4 h-4 ml-2 shrink-0" /> : null}
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
