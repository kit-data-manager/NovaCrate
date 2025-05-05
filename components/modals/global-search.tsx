import {
    CommandDialog,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command"
import { CurlyBraces, Folder, GitFork, Library, PackageSearch } from "lucide-react"
import { memo, useCallback, useEffect, useState } from "react"
import { useEditorState } from "@/lib/state/editor-state"
import { getEntityDisplayName } from "@/lib/utils"
import { EntityIcon } from "@/components/entity-icon"
import { useGoToEntityEditor, useGoToPage } from "@/lib/hooks"
import { useActionsStore } from "@/components/providers/actions-provider"
import { ActionCommandItem } from "@/components/actions/action-buttons"
import { useShallow } from "zustand/react/shallow"

export const GlobalSearch = memo(function GlobalSearch({
    open,
    onOpenChange
}: {
    open: boolean
    onOpenChange(open: boolean): void
}) {
    const [render, setRender] = useState(open)

    useEffect(() => {
        if (open) {
            setRender(true)
        } else {
            setTimeout(() => {
                setRender(false)
            }, 100)
        }
    }, [open])

    return render ? <GlobalSearchInner open={open} onOpenChange={onOpenChange} /> : null
})

function GlobalSearchInner({
    open,
    onOpenChange
}: {
    open: boolean
    onOpenChange(open: boolean): void
}) {
    const entities = useEditorState((store) => store.entities)
    const actions = useActionsStore(useShallow((store) => store.getAllActions()))

    const goToEntity = useGoToEntityEditor()

    const goToEntities = useGoToPage("entities")
    const goToFileExplorer = useGoToPage("file-explorer")
    const goToGraph = useGoToPage("graph")
    const goToJsonEditor = useGoToPage("json-editor")
    const goToContext = useGoToPage("context")

    const closeAnd = useCallback(
        (fn: () => void) => {
            fn()
            onOpenChange(false)
        },
        [onOpenChange]
    )

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput placeholder="Search for anything..." />
            <CommandList>
                <CommandGroup heading="Actions">
                    {actions
                        .filter((action) => action.id !== "editor.global-search")
                        .map((action) => (
                            <ActionCommandItem
                                key={action.id}
                                actionId={action.id}
                                closeAnd={closeAnd}
                            />
                        ))}
                </CommandGroup>
                <CommandGroup heading="Views">
                    <CommandItem value="show entity editor" onSelect={() => closeAnd(goToEntities)}>
                        <PackageSearch className="size-4 mr-2" /> Show Entity Editor
                    </CommandItem>
                    <CommandItem
                        value="show file entities"
                        onSelect={() => closeAnd(goToFileExplorer)}
                    >
                        <Folder className="size-4 mr-2" /> Show File Explorer
                    </CommandItem>
                    <CommandItem value="show graph" onSelect={() => closeAnd(goToGraph)}>
                        <GitFork className="size-4 mr-2" /> Show RO-Crate Graph
                    </CommandItem>
                    <CommandItem
                        value="edit ro-crate-metadata.json"
                        onSelect={() => closeAnd(goToJsonEditor)}
                    >
                        <CurlyBraces className="size-4 mr-2" /> Edit ro-crate-metadata.json
                    </CommandItem>
                    <CommandItem value="show context" onSelect={() => closeAnd(goToContext)}>
                        <Library className="size-4 mr-2" /> Show Context
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
