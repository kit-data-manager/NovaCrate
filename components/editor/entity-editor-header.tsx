import { Button } from "@/components/ui/button"
import { EllipsisVertical, PanelLeftClose, RefreshCw, Save } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { memo } from "react"
import { ActionButton, ActionDropdownMenuItem } from "@/components/actions/action-buttons"
import { useAction } from "@/lib/hooks"

export const EntityEditorHeader = memo(function EntityEditorHeader({
    isSaving,
    hasUnsavedChanges,
    canSaveAs,
    toggleEntityBrowserPanel
}: {
    hasUnsavedChanges: boolean
    isSaving: boolean
    canSaveAs: boolean
    toggleEntityBrowserPanel(): void
}) {
    const saveAction = useAction("entity.save")

    return (
        <div className="flex mb-2 gap-2 sticky top-0 z-10 p-2 bg-accent">
            <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={toggleEntityBrowserPanel}
            >
                <PanelLeftClose className="w-4 h-4" />
            </Button>
            <ActionButton
                actionId="entity.add-property"
                size="sm"
                variant="outline"
                className="text-xs"
                noShortcut
            />
            <ActionButton
                actionId="entity.find-references"
                size="sm"
                variant="outline"
                className="text-xs"
                noShortcut
            />

            <div className="grow"></div>

            <div className="flex gap-2 items-center text-sm">
                {hasUnsavedChanges ? (
                    <div className="text-muted-foreground">There are unsaved changes</div>
                ) : null}
                <Button
                    size="sm"
                    variant={hasUnsavedChanges ? undefined : "outline"}
                    className="text-xs"
                    onClick={() => saveAction.execute()}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <RefreshCw className={"w-4 h-4 mr-2 animate-spin"} />
                    ) : (
                        <Save className={"w-4 h-4 mr-2"} />
                    )}
                    {saveAction.name}
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <EllipsisVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {canSaveAs ? <ActionDropdownMenuItem actionId={"entity.save-as"} /> : null}
                        <ActionDropdownMenuItem actionId={"entity.revert"} />
                        <DropdownMenuSeparator />
                        <ActionDropdownMenuItem
                            actionId={"entity.delete"}
                            className="bg-destructive"
                        />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
})
