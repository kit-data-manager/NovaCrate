import { Button } from "@/components/ui/button"
import { EllipsisVertical, Eye, Folder, GitFork, RefreshCw, Save } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { memo } from "react"
import { ActionButton, ActionDropdownMenuItem } from "@/components/actions/action-buttons"
import { useAction } from "@/lib/hooks/hooks"
import { ValidationOverview } from "@/components/editor/validation/validation-overview"

export const EntityEditorHeader = memo(function EntityEditorHeader({
    entityId,
    isSaving,
    hasUnsavedChanges,
    canSaveAs,
    canHavePreview,
    togglePreview,
    isBeingPreviewed,
    goToGraph,
    goToFileExplorer,
    transparentBackground
}: {
    entityId: string
    hasUnsavedChanges: boolean
    isSaving: boolean
    canSaveAs: boolean
    canHavePreview: boolean
    togglePreview: () => void
    isBeingPreviewed: boolean
    goToGraph: () => void
    goToFileExplorer?: () => void
    transparentBackground: boolean
}) {
    const saveAction = useAction("entity.save")

    return (
        <div
            className={`flex gap-2 p-2 border-b border-t overflow-x-auto shrink-0 ${transparentBackground ? "border-b-transparent pt-4 pl-4 pr-4" : "bg-accent"} no-scrollbar transition-all`}
        >
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
                <ValidationOverview entityId={entityId} size="sm" />
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
                        <Button variant="outline" size="sm" aria-label={"More Options"}>
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
