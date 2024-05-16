import {
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger
} from "@/components/ui/context-menu"
import { Copy, Download, Eye, Plus } from "lucide-react"
import { EntityIcon } from "@/components/entity-icon"
import HelpTooltip from "@/components/help-tooltip"

export function EntryContextMenu({ entity, folder }: { entity?: IFlatEntity; folder?: boolean }) {
    return (
        <ContextMenuContent>
            <ContextMenuItem>
                <Eye className="w-4 h-4 mr-2" /> Preview
            </ContextMenuItem>
            <ContextMenuItem>
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
                    <ContextMenuItem>File Name</ContextMenuItem>
                    <ContextMenuItem>Full Path</ContextMenuItem>
                    {entity ? <ContextMenuItem>Entity ID</ContextMenuItem> : null}
                </ContextMenuSubContent>
            </ContextMenuSub>
            {!folder ? (
                <ContextMenuItem>
                    <Download className="w-4 h-4 mr-2" /> Download File
                </ContextMenuItem>
            ) : null}
        </ContextMenuContent>
    )
}
