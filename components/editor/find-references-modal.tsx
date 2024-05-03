import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command"
import { Skeleton } from "@/components/ui/skeleton"
import { memo, useCallback, useContext, useMemo } from "react"
import { camelCaseReadable, getEntityDisplayName } from "@/lib/utils"
import { useAsync } from "@/components/use-async"
import { Error } from "@/components/error"
import { useEditorState } from "@/components/editor-state"
import { createEntityEditorTab, EntityEditorTabsContext } from "@/components/entity-tabs-provider"
import { EntityIcon } from "@/components/entity-icon"

interface ReferencingEntity extends IFlatEntity {
    "@propertyNameReadable": string
    "@propertyName": string
}

const FindReferencesModalEntry = memo(function AddPropertyModalEntry({
    entity,
    onSelect
}: {
    entity: ReferencingEntity
    onSelect: (entity: IFlatEntity, propertyName: string) => void
}) {
    const readableName = useMemo(() => {
        return getEntityDisplayName(entity)
    }, [entity])

    return (
        <CommandItem
            className="text-md"
            key={entity["@id"]}
            value={readableName}
            onSelect={() => onSelect(entity, entity["@propertyName"])}
        >
            <div className="flex flex-col max-w-full w-full py-1">
                <div className="flex items-center">
                    <EntityIcon entity={entity} />
                    <div>{readableName}</div>
                    <div className="text-sm text-muted-foreground ml-2">
                        {entity["@propertyNameReadable"]}
                    </div>
                </div>
            </div>
        </CommandItem>
    )
})

export function FindReferencesModal({
    open,
    onOpenChange,
    entityId
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    entityId: string
}) {
    const entities = useEditorState.useEntities()
    const { openTab, focusProperty } = useContext(EntityEditorTabsContext)

    const onSelect = useCallback(
        (entity: IFlatEntity, propertyName: string) => {
            onOpenChange(false)
            openTab(createEntityEditorTab(entity), true)
            focusProperty(entity["@id"], propertyName)
        },
        [focusProperty, onOpenChange, openTab]
    )

    const referencesResolver = useCallback(
        async (entities: Map<string, IFlatEntity>) => {
            const result = new Set<ReferencingEntity>()
            for (const [_, entity] of entities) {
                for (const [propertyName, prop] of Object.entries(entity)) {
                    function handleEntry(prop: FlatEntitySinglePropertyTypes, index?: number) {
                        if (typeof prop === "object" && "@id" in prop && prop["@id"] === entityId) {
                            result.add({
                                ...entity,
                                "@propertyName": propertyName,
                                "@propertyNameReadable": `${camelCaseReadable(propertyName)}${index !== undefined ? " #" + (index + 1) : ""}`
                            })
                        }
                    }

                    if (Array.isArray(prop)) {
                        prop.forEach(handleEntry)
                    } else {
                        handleEntry(prop)
                    }
                }
            }
            return Array.from(result)
        },
        [entityId]
    )

    const {
        data: referencingEntities,
        error: referencingEntitiesError,
        isPending: referencingEntitiesPending
    } = useAsync(open ? entities : null, referencesResolver)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>References</DialogTitle>
                </DialogHeader>

                <Error
                    className="mt-4"
                    text={
                        referencingEntitiesError
                            ? "Error while searching for references: " + referencingEntitiesError
                            : ""
                    }
                />

                <Command className="py-2">
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {open && referencingEntities && !referencingEntitiesPending ? (
                                referencingEntities.map((referencingEntity) => {
                                    return (
                                        <FindReferencesModalEntry
                                            key={referencingEntity["@id"]}
                                            entity={referencingEntity}
                                            onSelect={onSelect}
                                        />
                                    )
                                })
                            ) : (
                                <CommandItem className="flex flex-col gap-2">
                                    <Skeleton className={"w-full h-8"} />
                                    <Skeleton className={"w-full h-8"} />
                                    <Skeleton className={"w-full h-8"} />
                                </CommandItem>
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </DialogContent>
        </Dialog>
    )
}
