import {
    CommandDialog,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command"
import {
    CurlyBraces,
    FileUp,
    Folder,
    FolderArchive,
    FolderUp,
    GitFork,
    Library,
    PackageSearch,
    Plus,
    RefreshCcw,
    SaveAll,
    Undo2
} from "lucide-react"
import { useCallback, useContext } from "react"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { useEditorState } from "@/lib/state/editor-state"
import { getEntityDisplayName } from "@/lib/utils"
import { EntityIcon } from "@/components/entity-icon"
import { useGoToEntity, useGoToPage, useSaveAllEntities } from "@/lib/hooks"
import { RO_CRATE_DATASET, RO_CRATE_FILE } from "@/lib/constants"
import { CrateDataContext } from "@/components/providers/crate-data-provider"

export function GlobalSearch({
    open,
    onOpenChange
}: {
    open: boolean
    onOpenChange(open: boolean): void
}) {
    const { showCreateEntityModal } = useContext(GlobalModalContext)
    const entities = useEditorState.useEntities()
    const revertAllEntities = useEditorState.useRevertAllEntities()
    const { serviceProvider, crateId, reload } = useContext(CrateDataContext)

    const uploadFile = useCallback(() => {
        showCreateEntityModal([{ "@id": RO_CRATE_FILE, comment: "" }])
    }, [showCreateEntityModal])

    const uploadFolder = useCallback(() => {
        showCreateEntityModal([{ "@id": RO_CRATE_DATASET, comment: "" }])
    }, [showCreateEntityModal])

    const downloadCrateAsZip = useCallback(() => {
        if (serviceProvider) {
            serviceProvider.downloadCrateZip(crateId).then()
        }
    }, [crateId, serviceProvider])

    const saveAllEntities = useSaveAllEntities()

    const goToEntity = useGoToEntity()

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
                    <CommandItem
                        value="add new entity"
                        onSelect={() => closeAnd(showCreateEntityModal)}
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add new Entity
                    </CommandItem>
                    <CommandItem value="upload a file" onSelect={() => closeAnd(uploadFile)}>
                        <FileUp className="w-4 h-4 mr-2" /> Upload a File
                    </CommandItem>
                    <CommandItem value="upload a folder" onSelect={() => closeAnd(uploadFolder)}>
                        <FolderUp className="w-4 h-4 mr-2" /> Upload a Folder
                    </CommandItem>
                    <CommandItem
                        value="save all entities"
                        onSelect={() => closeAnd(saveAllEntities)}
                    >
                        <SaveAll className="w-4 h-4 mr-2" /> Save all Entities
                    </CommandItem>
                    <CommandItem
                        value="revert all entities"
                        onSelect={() => closeAnd(revertAllEntities)}
                    >
                        <Undo2 className="w-4 h-4 mr-2" /> Revert all Entities
                    </CommandItem>
                    <CommandItem
                        value="download crate as zip"
                        onSelect={() => closeAnd(downloadCrateAsZip)}
                    >
                        <FolderArchive className="w-4 h-4 mr-2" /> Download Crate as .zip
                    </CommandItem>
                    <CommandItem value="reload entities" onSelect={() => closeAnd(reload)}>
                        <RefreshCcw className="w-4 h-4 mr-2" /> Reload Entities
                    </CommandItem>
                </CommandGroup>
                <CommandGroup heading="Views">
                    <CommandItem value="show entity editor" onSelect={() => closeAnd(goToEntities)}>
                        <PackageSearch className="w-4 h-4 mr-2" /> Show Entity Editor
                    </CommandItem>
                    <CommandItem
                        value="show file entities"
                        onSelect={() => closeAnd(goToFileExplorer)}
                    >
                        <Folder className="w-4 h-4 mr-2" /> Show File Explorer
                    </CommandItem>
                    <CommandItem value="show graph" onSelect={() => closeAnd(goToGraph)}>
                        <GitFork className="w-4 h-4 mr-2" /> Show RO-Crate Graph
                    </CommandItem>
                    <CommandItem
                        value="edit ro-crate-metadata.json"
                        onSelect={() => closeAnd(goToJsonEditor)}
                    >
                        <CurlyBraces className="w-4 h-4 mr-2" /> Edit ro-crate-metadata.json
                    </CommandItem>
                    <CommandItem value="show context" onSelect={() => closeAnd(goToContext)}>
                        <Library className="w-4 h-4 mr-2" /> Show Context
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
