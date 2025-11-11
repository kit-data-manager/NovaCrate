import {
    Copy,
    EllipsisVertical,
    Eye,
    Folder,
    Pencil,
    ScanBarcode,
    File,
    ExternalLink
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useCopyToClipboard } from "usehooks-ts"
import { useCallback, useMemo, useState } from "react"
import { useEditorState } from "@/lib/state/editor-state"
import { canHavePreview as canHavePreviewUtil } from "@/lib/utils"
import { useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"
import { Button } from "@/components/ui/button"
import { RenameEntityModal } from "@/components/modals/rename-entity-modal"
import { useGoToFileExplorer } from "@/lib/hooks"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function IDField({ value }: { value: string }) {
    const [, copy] = useCopyToClipboard()
    const entity = useEditorState((state) => state.entities.get(value))
    const previewingFilePath = useEntityEditorTabs((store) => store.previewingFilePath)
    const setPreviewingFilePath = useEntityEditorTabs((store) => store.setPreviewingFilePath)
    const [renameEntityModalOpen, setRenameEntityModalOpen] = useState(false)

    const canHavePreview = useMemo(() => {
        return entity ? canHavePreviewUtil(entity) : false
    }, [entity])

    const showInFileExplorer = useGoToFileExplorer(entity)

    const togglePreview = useCallback(() => {
        if (entity?.["@type"]) {
            if (previewingFilePath === value) {
                setPreviewingFilePath("")
            } else {
                setPreviewingFilePath(value)
            }
        }
    }, [entity, previewingFilePath, setPreviewingFilePath, value])

    const copyFn = useCallback(() => {
        copy(value).then()
    }, [copy, value])

    const isExternalResource = useMemo(() => {
        try {
            const url = new URL(value)
            return url.protocol.toLowerCase() === "http:" || url.protocol.toLowerCase() === "https:"
        } catch {
            return false
        }
    }, [value])

    const Icon = useMemo(() => {
        if (canHavePreview) return File
        if (isExternalResource) return ExternalLink
        return ScanBarcode
    }, [canHavePreview, isExternalResource])

    const openExternalResource = useCallback(() => {
        window.open(value, "_blank", "noopener,noreferrer")
    }, [value])

    return (
        <div className="flex grow justify-start pl-3 items-center rounded-lg min-w-0">
            <RenameEntityModal
                entityId={value}
                onOpenChange={setRenameEntityModalOpen}
                open={renameEntityModalOpen}
            />

            <Icon className="size-4 pointer-events-none text-muted-foreground mr-2 shrink-0" />
            <Tooltip delayDuration={500}>
                <TooltipTrigger asChild>
                    <span className="truncate grow">{value}</span>
                </TooltipTrigger>
                <TooltipContent>{value}</TooltipContent>
            </Tooltip>

            <DropdownMenu>
                <DropdownMenuTrigger className="p-2" asChild>
                    <Button variant={"outline"} id={"id-dropdown-trigger"}>
                        <EllipsisVertical className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent id={"id-dropdown"}>
                    <DropdownMenuItem onClick={() => setRenameEntityModalOpen(true)}>
                        <Pencil className="size-4 mr-2" /> Edit Identifier
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={copyFn}>
                        <Copy className="size-4 mr-2" /> Copy Identifier
                    </DropdownMenuItem>
                    {canHavePreview ? (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={togglePreview}>
                                <Eye className="size-4 mr-2" /> Preview File
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => showInFileExplorer()}>
                                <Folder className="size-4 mr-2" /> Show in File Explorer
                            </DropdownMenuItem>
                        </>
                    ) : null}
                    {isExternalResource ? (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={openExternalResource}>
                                <ExternalLink className="size-4 mr-2" /> Open with Browser
                            </DropdownMenuItem>
                        </>
                    ) : null}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
