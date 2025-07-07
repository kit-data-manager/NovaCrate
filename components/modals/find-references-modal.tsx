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
import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { camelCaseReadable, getEntityDisplayName } from "@/lib/utils"
import { useEditorState } from "@/lib/state/editor-state"
import { createEntityEditorTab, useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"
import { EntityIcon } from "@/components/entity/entity-icon"
import { useGoToEntityEditor } from "@/lib/hooks"

interface ReferencingEntity extends IEntity {
    "@propertyNameReadable": string
    "@propertyName": string
}

const FindReferencesModalEntry = memo(function AddPropertyModalEntry({
    entity,
    onSelect
}: {
    entity: ReferencingEntity
    onSelect: (entity: IEntity, propertyName: string) => void
}) {
    const readableName = useMemo(() => {
        return getEntityDisplayName(entity)
    }, [entity])

    return (
        <CommandItem
            className="text-md"
            key={entity["@id"]}
            value={readableName + entity["@propertyName"]}
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

export const FindReferencesModal = memo(function FindReferencesModal(props: {
    open: boolean
    onOpenChange: (open: boolean) => void
    entityId: string
}) {
    const [render, setRender] = useState(props.open)

    useEffect(() => {
        if (props.open) {
            setRender(true)
        } else {
            setTimeout(() => {
                setRender(false)
            }, 100)
        }
    }, [props.open])

    return render ? <FindReferencesModalInner {...props} /> : null
})

export function FindReferencesModalInner({
    open,
    onOpenChange,
    entityId
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    entityId: string
}) {
    const entities = useEditorState((store) => store.entities)
    const goToEntityEditor = useGoToEntityEditor()
    const openTab = useEntityEditorTabs((store) => store.openTab)
    const focusProperty = useEntityEditorTabs((store) => store.focusProperty)

    const onSelect = useCallback(
        (entity: IEntity, propertyName: string) => {
            onOpenChange(false)
            goToEntityEditor()
            openTab(createEntityEditorTab(entity), true)
            focusProperty(entity["@id"], propertyName)
        },
        [focusProperty, goToEntityEditor, onOpenChange, openTab]
    )

    const referencesResolver = useCallback(
        (entities: Map<string, IEntity>) => {
            const result = new Set<ReferencingEntity>()
            for (const [, entity] of entities) {
                for (const [propertyName, prop] of Object.entries(entity)) {
                    function handleEntry(prop: EntitySinglePropertyTypes, index?: number) {
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

    const referencingEntities = useMemo(() => {
        if (!open) return null
        return referencesResolver(entities)
    }, [entities, open, referencesResolver])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>References</DialogTitle>
                </DialogHeader>

                <Command className="py-2">
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {open && referencingEntities ? (
                                referencingEntities.map((referencingEntity) => {
                                    return (
                                        <FindReferencesModalEntry
                                            key={
                                                referencingEntity["@id"] +
                                                referencingEntity["@propertyName"]
                                            }
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
