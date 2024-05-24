import {
    CommandDialog,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command"
import { Plus } from "lucide-react"
import { useCallback, useContext } from "react"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { useEditorState } from "@/lib/state/editor-state"
import { getEntityDisplayName } from "@/lib/utils"
import { EntityIcon } from "@/components/entity-icon"
import { useGoToEntity } from "@/lib/hooks"

export function GlobalSearch({
    open,
    onOpenChange
}: {
    open: boolean
    onOpenChange(open: boolean): void
}) {
    const { showCreateEntityModal } = useContext(GlobalModalContext)
    const entities = useEditorState.useEntities()

    const goToEntity = useGoToEntity()

    const closeAnd = useCallback(
        (fn: () => void) => {
            fn()
            onOpenChange(false)
        },
        [onOpenChange]
    )

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange} top>
            <CommandInput placeholder="Search for anything..." />
            <CommandList>
                <CommandGroup heading="Actions">
                    <CommandItem
                        value="add new entity"
                        onSelect={() => closeAnd(showCreateEntityModal)}
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add new Entity
                    </CommandItem>
                </CommandGroup>
                <CommandGroup heading="Entities">
                    {Array.from(entities.values()).map((entity) => (
                        <CommandItem
                            key={entity["@id"]}
                            value={getEntityDisplayName(entity)}
                            onSelect={() => closeAnd(() => goToEntity(entity))}
                        >
                            <EntityIcon entity={entity} />
                            {getEntityDisplayName(entity)}
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    )
}
