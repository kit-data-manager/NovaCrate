import { Button } from "@/components/ui/button"
import {
    EllipsisVertical,
    PanelLeftClose,
    Plus,
    RefreshCw,
    Save,
    Search,
    Trash,
    Undo2
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { memo } from "react"

export const EntityEditorHeader = memo(function EntityEditorHeader({
    isSaving,
    saveChanges,
    hasUnsavedChanges
}: {
    hasUnsavedChanges: boolean
    isSaving: boolean
    saveChanges(): void
}) {
    return (
        <div className="flex mb-2 gap-2 sticky top-0 z-10 p-2 bg-accent">
            <Button size="sm" variant="outline" className="text-xs">
                <PanelLeftClose className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" className="text-xs">
                <Plus className={"w-4 h-4 mr-1"} /> Add Property
            </Button>
            <Button size="sm" variant="outline" className="text-xs">
                <Search className="w-4 h-4 mr-1" /> Find References
            </Button>
            <Button size="sm" variant="destructive" className="text-xs">
                <Trash className="w-4 h-4 mr-1" /> Delete Entity
            </Button>
            <div className="grow"></div>
            <div className="flex gap-2 items-center text-sm">
                {hasUnsavedChanges ? (
                    <div className="text-muted-foreground">There are unsaved changes</div>
                ) : null}
                <Button
                    size="sm"
                    variant={hasUnsavedChanges ? undefined : "outline"}
                    className="text-xs"
                    onClick={() => saveChanges()}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <RefreshCw className={"w-4 h-4 mr-2 animate-spin"} />
                    ) : (
                        <Save className={"w-4 h-4 mr-2"} />
                    )}{" "}
                    Save
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <EllipsisVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem>
                            <Save className="w-4 h-4 mr-2" /> Save as...
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Undo2 className="w-4 h-4 mr-2" /> Revert Changes
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
})
