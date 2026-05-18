import {
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger
} from "@/components/ui/context-menu"
import {
    Copy,
    CurlyBraces,
    Download,
    EyeIcon,
    FileIcon,
    FolderOpen,
    PenLineIcon,
    Plus,
    Trash
} from "lucide-react"
import { EntityIcon } from "@/components/entity/entity-icon"
import HelpTooltip from "@/components/help-tooltip"
import { useCallback, useContext, useMemo } from "react"
import { useCopyToClipboard } from "usehooks-ts"
import { usePersistence } from "@/components/providers/persistence-provider"
import { downloadBlob } from "@/lib/core/util"
import { useFileExplorerState } from "@/lib/state/file-explorer-state"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { encodeFilePath, getFolderPath } from "@/lib/utils"
import { RO_CRATE_DATASET, RO_CRATE_FILE } from "@/lib/constants"
import { useGoToPage } from "@/lib/hooks/hooks"

export function EntryContextMenu({
    entity,
    filePath,
    fileName,
    folder,
    goToEntity,
    blankSpace,
    rename
}: {
    entity?: IEntity
    filePath?: string
    fileName?: string
    folder?: boolean
    goToEntity?: () => void
    blankSpace?: boolean
    rename?: () => void
}) {
    const persistence = usePersistence()
    const setDownloadError = useFileExplorerState((store) => store.setDownloadError)
    const setPreviewingFilePath = useFileExplorerState((s) => s.setPreviewingFilePath)

    const { showCreateEntityModal, showDeleteEntityModal } = useContext(GlobalModalContext)
    const [, copy] = useCopyToClipboard()

    const copyText = useCallback(
        (text: string) => {
            copy(text).catch(console.error)
        },
        [copy]
    )

    const downloadFile = useCallback(() => {
        const fileService = persistence.getCrateService()?.getFileService()
        if (fileService && filePath) {
            fileService
                .getFile(filePath)
                .then((blob) => downloadBlob(blob, filePath.split("/").pop() || filePath))
                .catch(setDownloadError)
        }
    }, [filePath, persistence, setDownloadError])

    const createEntityForExistingFile = useCallback(() => {
        if (!filePath) return null
        showCreateEntityModal(
            [{ "@id": folder ? RO_CRATE_DATASET : RO_CRATE_FILE, comment: "Click here" }],
            undefined,
            encodeFilePath(filePath)
        )
    }, [filePath, folder, showCreateEntityModal])

    const createNewFile = useCallback(() => {
        showCreateEntityModal(
            [{ "@id": RO_CRATE_FILE, comment: "Click here" }],
            undefined,
            undefined,
            getFolderPath(filePath || "")
        )
    }, [filePath, showCreateEntityModal])

    const createNewFolder = useCallback(() => {
        showCreateEntityModal(
            [{ "@id": RO_CRATE_DATASET, comment: "Click here" }],
            undefined,
            undefined,
            getFolderPath(filePath || "")
        )
    }, [filePath, showCreateEntityModal])

    const NewButtons = useMemo(() => {
        return (
            <ContextMenuSub>
                <ContextMenuSubTrigger>
                    <Plus className="size-4 mr-2" /> New
                </ContextMenuSubTrigger>
                <ContextMenuSubContent>
                    <ContextMenuItem onClick={createNewFile}>
                        <FileIcon className="size-4 mr-2" /> File
                    </ContextMenuItem>
                    <ContextMenuItem onClick={createNewFolder}>
                        <FolderOpen className="size-4 mr-2" /> Folder
                    </ContextMenuItem>
                </ContextMenuSubContent>
            </ContextMenuSub>
        )
    }, [createNewFile, createNewFolder])

    const goToJsonEditor = useGoToPage("json-editor")

    if (blankSpace) return <ContextMenuContent>{NewButtons}</ContextMenuContent>

    return (
        <ContextMenuContent className="min-w-52">
            {entity ? (
                <ContextMenuItem onClick={() => (goToEntity ? goToEntity() : "")}>
                    <EntityIcon entity={entity} size="sm" /> Go to Entity
                </ContextMenuItem>
            ) : (
                <ContextMenuItem onClick={createEntityForExistingFile}>
                    <Plus className="size-4 mr-2" /> Create Entity
                    <HelpTooltip className="ml-2">
                        This file or folder is present in the RO-Crate, but currently no
                        corresponding Data Entity exists. Create a corresponding Entity to add
                        metadata to the file or folder.
                    </HelpTooltip>
                </ContextMenuItem>
            )}
            {filePath && !filePath.endsWith("/") && (
                <ContextMenuItem onClick={() => setPreviewingFilePath(filePath)}>
                    <EyeIcon className="size-4 mr-2" /> Preview File
                </ContextMenuItem>
            )}

            <ContextMenuSeparator />

            {filePath === "ro-crate-metadata.json" ? (
                <ContextMenuItem onClick={goToJsonEditor}>
                    <CurlyBraces className="size-4 mr-2" /> Edit in JSON Editor
                </ContextMenuItem>
            ) : null}

            {!folder ? (
                <ContextMenuItem onClick={downloadFile}>
                    <Download className="size-4 mr-2" /> Download
                </ContextMenuItem>
            ) : null}
            <ContextMenuSub>
                <ContextMenuSubTrigger>
                    <Copy className="size-4 mr-2" /> Copy
                </ContextMenuSubTrigger>
                <ContextMenuSubContent>
                    {fileName ? (
                        <ContextMenuItem onClick={() => copyText(fileName)}>
                            File Name
                        </ContextMenuItem>
                    ) : null}
                    {filePath ? (
                        <ContextMenuItem onClick={() => copyText(filePath)}>
                            Full Path
                        </ContextMenuItem>
                    ) : null}
                    {entity ? (
                        <ContextMenuItem onClick={() => copyText(entity["@id"])}>
                            Entity ID
                        </ContextMenuItem>
                    ) : null}
                </ContextMenuSubContent>
            </ContextMenuSub>

            {rename && (
                <ContextMenuItem onClick={() => rename()}>
                    <PenLineIcon className="size-4 mr-2" /> Change{" "}
                    {filePath?.endsWith("/") ? "Folder" : "File"} Name
                </ContextMenuItem>
            )}
            {entity || filePath ? (
                <ContextMenuItem
                    onClick={() => showDeleteEntityModal(entity?.["@id"] || filePath!)}
                >
                    <Trash className="size-4 mr-2" /> Delete
                </ContextMenuItem>
            ) : null}

            <ContextMenuSeparator />
            {NewButtons}
        </ContextMenuContent>
    )
}
