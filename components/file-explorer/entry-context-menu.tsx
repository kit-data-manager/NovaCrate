import {
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger
} from "@/components/ui/context-menu"
import { Copy, Download, FileIcon, FolderOpen, Plus, Trash } from "lucide-react"
import { EntityIcon } from "@/components/entity-icon"
import HelpTooltip from "@/components/help-tooltip"
import { useCallback, useContext } from "react"
import { useCopyToClipboard } from "usehooks-ts"
import { CrateDataContext } from "@/components/crate-data-provider"
import { FileExplorerContext } from "@/components/file-explorer/context"
import { GlobalModalContext } from "@/components/global-modals-provider"
import { encodeFilePath, getFolderPath } from "@/lib/utils"
import { RO_CRATE_DATASET, RO_CRATE_FILE } from "@/lib/constants"

export function EntryContextMenu({
    entity,
    filePath,
    fileName,
    folder,
    goToEntity
}: {
    entity?: IFlatEntity
    filePath: string
    fileName: string
    folder?: boolean
    goToEntity(): void
}) {
    const { serviceProvider, crateId } = useContext(CrateDataContext)
    const { setDownloadError } = useContext(FileExplorerContext)
    const { showCreateEntityModal, showDeleteEntityModal } = useContext(GlobalModalContext)
    const [_, copy] = useCopyToClipboard()

    const copyText = useCallback(
        (text: string) => {
            copy(text).catch(console.error)
        },
        [copy]
    )

    const downloadFile = useCallback(() => {
        if (serviceProvider) {
            serviceProvider.downloadFile(crateId, filePath).catch(setDownloadError)
        }
    }, [crateId, filePath, serviceProvider, setDownloadError])

    const createEntityForExistingFile = useCallback(() => {
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
            getFolderPath(filePath)
        )
    }, [filePath, showCreateEntityModal])

    const createNewFolder = useCallback(() => {
        showCreateEntityModal(
            [{ "@id": RO_CRATE_DATASET, comment: "Click here" }],
            undefined,
            undefined,
            getFolderPath(filePath)
        )
    }, [filePath, showCreateEntityModal])

    return (
        <ContextMenuContent>
            {entity ? (
                <ContextMenuItem onClick={goToEntity}>
                    <EntityIcon entity={entity} size="sm" /> Go to Entity
                </ContextMenuItem>
            ) : (
                <ContextMenuItem onClick={createEntityForExistingFile}>
                    <Plus className="w-4 h-4 mr-2" /> Create Entity
                    <HelpTooltip className="ml-2">
                        This file or folder is present in the RO-Crate, but currently no
                        corresponding Data Entity exists. Create a corresponding Entity to add
                        metadata to the file or folder.
                    </HelpTooltip>
                </ContextMenuItem>
            )}

            <ContextMenuSeparator />
            <ContextMenuSub>
                <ContextMenuSubTrigger>
                    <Copy className="w-4 h-4 mr-2" /> Copy
                </ContextMenuSubTrigger>
                <ContextMenuSubContent>
                    <ContextMenuItem onClick={() => copyText(fileName)}>File Name</ContextMenuItem>
                    <ContextMenuItem onClick={() => copyText(filePath)}>Full Path</ContextMenuItem>
                    {entity ? (
                        <ContextMenuItem onClick={() => copyText(entity["@id"])}>
                            Entity ID
                        </ContextMenuItem>
                    ) : null}
                </ContextMenuSubContent>
            </ContextMenuSub>
            {!folder ? (
                <ContextMenuItem onClick={downloadFile}>
                    <Download className="w-4 h-4 mr-2" /> Export
                </ContextMenuItem>
            ) : null}

            <ContextMenuItem
                className="bg-destructive"
                onClick={() => showDeleteEntityModal(entity?.["@id"] || filePath)}
            >
                <Trash className="w-4 h-4 mr-2" /> Delete
            </ContextMenuItem>

            <ContextMenuSeparator />

            <ContextMenuSub>
                <ContextMenuSubTrigger>
                    <Plus className="w-4 h-4 mr-2" /> New
                </ContextMenuSubTrigger>
                <ContextMenuSubContent>
                    <ContextMenuItem onClick={createNewFile}>
                        <FileIcon className="w-4 h-4 mr-2" /> File
                    </ContextMenuItem>
                    <ContextMenuItem onClick={createNewFolder}>
                        <FolderOpen className="w-4 h-4 mr-2" /> Folder
                    </ContextMenuItem>
                </ContextMenuSubContent>
            </ContextMenuSub>
        </ContextMenuContent>
    )
}
