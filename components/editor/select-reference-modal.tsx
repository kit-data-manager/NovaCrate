import { useCallback, useContext, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command"
import { Checkbox } from "@/components/ui/checkbox"
import { CrateDataContext, TEST_CONTEXT } from "@/components/crate-data-provider"
import { getEntityDisplayName, isRoCrateMetadataEntity, isRootEntity, toArray } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { EntityIcon } from "@/components/entity-icon"
import { SlimClass } from "@/lib/crate-verify/helpers"

function SelectReferenceModalEntry({
    entity,
    onSelect
}: {
    entity: IFlatEntity
    onSelect: (ref: IReference) => void
}) {
    const displayName = useMemo(() => {
        return getEntityDisplayName(entity)
    }, [entity])

    const onSelectSelf = useCallback(() => {
        onSelect({
            "@id": entity["@id"]
        })
    }, [entity, onSelect])

    return (
        <CommandItem
            className="text-md"
            value={displayName + entity["@id"]}
            onSelect={() => onSelectSelf()}
        >
            <div className="flex items-center max-w-full w-full">
                <EntityIcon entity={entity} />
                <div className="truncate">
                    <span>{displayName}</span>
                </div>
                <span className="text-sm text-muted-foreground ml-2">
                    {toArray(entity["@type"]).join(", ")}
                </span>
            </div>
        </CommandItem>
    )
}

export function SelectReferenceModal({
    open,
    onSelect,
    onOpenChange,
    propertyRange
}: {
    open: boolean
    onSelect: (ref: IReference) => void
    onOpenChange: (open: boolean) => void
    propertyRange?: SlimClass[]
}) {
    const { crateData, crateDataIsLoading } = useContext(CrateDataContext)

    const propertyRangeIds = useMemo(() => {
        return propertyRange?.map((p) => p["@id"])
    }, [propertyRange])

    const possibleEntities = useMemo(() => {
        if (!open || crateDataIsLoading || !crateData || !propertyRangeIds) return []

        return crateData["@graph"]
            .filter((e) => !isRootEntity(e))
            .filter((e) => !isRoCrateMetadataEntity(e))
            .filter((entity) => {
                for (const type of toArray(entity["@type"])) {
                    const resolved = TEST_CONTEXT.resolve(type)
                    if (!resolved) continue
                    if (propertyRangeIds.includes(resolved)) return true
                }

                return false
            })
    }, [crateData, crateDataIsLoading, open, propertyRangeIds])

    const onSelectAndClose = useCallback(
        (ref: IReference) => {
            onOpenChange(false)
            onSelect(ref)
        },
        [onOpenChange, onSelect]
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select Entity to Reference</DialogTitle>
                </DialogHeader>

                <Command className="py-2">
                    <CommandInput placeholder="Search all matching entities..." />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {open ? (
                                possibleEntities.map((e) => {
                                    return (
                                        <SelectReferenceModalEntry
                                            key={e["@id"]}
                                            entity={e}
                                            onSelect={(r) => onSelectAndClose(r)}
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

                <div className="flex gap-2 items-center">
                    <Checkbox checked id="onlyShowMatching-reference" />
                    <label htmlFor="onlyShowMatching">Only show Entities of matching type</label>
                </div>
            </DialogContent>
        </Dialog>
    )
}
