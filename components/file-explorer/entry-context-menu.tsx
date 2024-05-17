import {
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger
} from "@/components/ui/context-menu"
import { Copy, Download, Plus } from "lucide-react"
import { EntityIcon } from "@/components/entity-icon"
import HelpTooltip from "@/components/help-tooltip"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useContext } from "react"
import { createEntityEditorTab, EntityEditorTabsContext } from "@/components/entity-tabs-provider"
import { useCopyToClipboard } from "usehooks-ts"
import { CrateDataContext } from "@/components/crate-data-provider"
import { FileExplorerContext } from "@/components/file-explorer/context"

export function EntryContextMenu({
    entity,
    filePath,
    fileName,
    folder
}: {
    entity?: IFlatEntity
    filePath: string
    fileName: string
    folder?: boolean
}) {
    const { serviceProvider, crateId } = useContext(CrateDataContext)
    const { openTab } = useContext(EntityEditorTabsContext)
    const { setDownloadError } = useContext(FileExplorerContext)
    const pathname = usePathname()
    const router = useRouter()
    const [_, copy] = useCopyToClipboard()

    const goToEntity = useCallback(() => {
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

    return (
        <ContextMenuContent>
            <ContextMenuItem onClick={goToEntity}>
                {entity ? (
                    <>
                        <EntityIcon entity={entity} size="sm" /> Go to Entity
                    </>
                ) : (
                    <>
                        <Plus className="w-4 h-4 mr-2" /> Create Entity
                        <HelpTooltip className="ml-2">
                            This file or folder is present in the RO-Crate, but currently no
                            corresponding Data Entity exists. Create a corresponding Entity to add
                            metadata to the file.
                        </HelpTooltip>
                    </>
                )}
            </ContextMenuItem>
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
                    <Download className="w-4 h-4 mr-2" /> Download File
                </ContextMenuItem>
            ) : null}
        </ContextMenuContent>
    )
}
