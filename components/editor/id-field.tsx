import { Copy, EllipsisVertical, Eye, ScanBarcode } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useCopyToClipboard } from "usehooks-ts"
import { useCallback, useMemo } from "react"
import { useEditorState } from "@/lib/state/editor-state"
import { canHavePreview as canHavePreviewUtil } from "@/lib/utils"
import { useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"

export function IDField({ value }: { value: string }) {
    const [_, copy] = useCopyToClipboard()
    const type = useEditorState((state) => state.entities.get(value)?.["@type"])
    const previewingFilePath = useEntityEditorTabs((store) => store.previewingFilePath)
    const setPreviewingFilePath = useEntityEditorTabs((store) => store.setPreviewingFilePath)

    const canHavePreview = useMemo(() => {
        return type
            ? canHavePreviewUtil({
                  // Dirty hack but should be perfectly fine, since we have no access to the full entity here
                  "@id": value,
                  "@type": type
              })
            : false
    }, [type, value])

    const togglePreview = useCallback(() => {
        if (type) {
            if (previewingFilePath === value) {
                setPreviewingFilePath("")
            } else {
                setPreviewingFilePath(value)
            }
        }
    }, [previewingFilePath, setPreviewingFilePath, type, value])

    const copyFn = useCallback(() => {
        copy(value).then()
    }, [copy, value])

    return (
        <div className="flex grow justify-start pl-3 items-center rounded-lg p-2">
            <ScanBarcode className="w-4 h-4 pointer-events-none text-muted-foreground mr-2 shrink-0" />
            <span className="truncate grow">{value}</span>
            <DropdownMenu>
                <DropdownMenuTrigger className="p-2">
                    <EllipsisVertical className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {canHavePreview ? (
                        <DropdownMenuItem onClick={togglePreview}>
                            <Eye className="w-4 h-4 mr-2" /> Preview File
                        </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem onClick={copyFn}>
                        <Copy className="w-4 h-4 mr-2" /> Copy Identifier
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
