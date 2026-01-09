import { Button } from "@/components/ui/button"
import {
    EllipsisVertical,
    Eye,
    Folder,
    GitFork,
    PanelLeftClose,
    RefreshCw,
    Save
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { memo } from "react"
import { ActionButton, ActionDropdownMenuItem } from "@/components/actions/action-buttons"
import { useAction } from "@/lib/hooks"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export const EntityEditorHeader = memo(function EntityEditorHeader({
    isSaving,
    hasUnsavedChanges,
    canSaveAs,
    toggleEntityBrowserPanel,
    canHavePreview,
    togglePreview,
    isBeingPreviewed,
    goToGraph,
    goToFileExplorer
}: {
    hasUnsavedChanges: boolean
    isSaving: boolean
    canSaveAs: boolean
    toggleEntityBrowserPanel(): void
    canHavePreview: boolean
    togglePreview: () => void
    isBeingPreviewed: boolean
    goToGraph: () => void
    goToFileExplorer?: () => void
}) {
    const saveAction = useAction("entity.save")

    return (
        <div className="flex gap-2 p-2 border-b border-t overflow-x-auto shrink-0">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={toggleEntityBrowserPanel}
                    >
                        <PanelLeftClose className="size-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle Entity Browser</TooltipContent>
            </Tooltip>

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
                    <div className="text-muted-foreground truncate">There are unsaved changes</div>
                ) : null}
                <Button
                    size="sm"
                    variant={hasUnsavedChanges ? undefined : "outline"}
                    className="text-xs"
                    onClick={() => saveAction.execute()}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <RefreshCw className={"size-4 mr-2 animate-spin"} />
                    ) : (
                        <Save className={"size-4 mr-2"} />
                    )}
                    {saveAction.name}
                </Button>
                {canHavePreview ? (
                    <Button
                        variant={isBeingPreviewed ? "default" : "outline"}
                        size={"sm"}
                        className={`text-xs transition-colors`}
                        onClick={togglePreview}
                    >
                        <Eye className="size-4 mr-2" /> Preview File
                    </Button>
                ) : null}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <EllipsisVertical className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={goToGraph}>
                            <GitFork className="size-4 mr-2" /> Show in Graph
                        </DropdownMenuItem>
                        {goToFileExplorer ? (
                            <DropdownMenuItem onClick={goToFileExplorer}>
                                <Folder className="size-4 mr-2" /> Show in File Explorer
                            </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuSeparator />
                        {canSaveAs ? <ActionDropdownMenuItem actionId={"entity.save-as"} /> : null}
                        <ActionDropdownMenuItem actionId={"entity.revert"} />
                        <DropdownMenuSeparator />
                        <ActionDropdownMenuItem
                            actionId={"entity.delete"}
                            variant={"destructive"}
                        />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
})
