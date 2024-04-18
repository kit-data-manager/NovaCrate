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
import { Skeleton } from "@/components/ui/skeleton"
import { SchemaNode } from "@/lib/crate-verify/SchemaGraph"
import { useCallback } from "react"

export interface PossibleProperty {
    propertyName: string
    range: string[]
    comment: SchemaNode["comment"]
}

export function AddPropertyModal({
    open,
    onPropertyAdd,
    onOpenChange,
    possibleProperties,
    possiblePropertiesPending
}: {
    open: boolean
    onPropertyAdd: (propertyName: string, values?: FlatEntitySinglePropertyTypes[]) => void
    onOpenChange: (open: boolean) => void
    possibleProperties?: PossibleProperty[]
    possiblePropertiesPending: boolean
}) {
    const onSelect = useCallback(
        (value: string, range: string[]) => {
            onOpenChange(false)
            onPropertyAdd(value, range.includes("Text") ? [""] : [{ "@id": "" }])
        },
        [onOpenChange, onPropertyAdd]
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select a Property</DialogTitle>
                </DialogHeader>

                <Command className="py-2">
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {open && possibleProperties && !possiblePropertiesPending ? (
                                possibleProperties.map((e) => {
                                    return (
                                        <CommandItem
                                            className="text-md"
                                            key={e.propertyName}
                                            value={e.propertyName}
                                            onSelect={(v) => onSelect(v, e.range)}
                                        >
                                            <div className="flex flex-col max-w-full w-full">
                                                <div className="flex justify-between">
                                                    <div>{e.propertyName}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {e.range.join(", ")}
                                                    </div>
                                                </div>
                                                <div className="truncate text-xs">
                                                    <span>{e.comment + ""}</span>
                                                </div>
                                            </div>
                                        </CommandItem>
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
                    <Checkbox checked id="onlyShowAllowed-create" />
                    <label htmlFor="onlyShowMatching">Only show allowed Properties</label>
                </div>
            </DialogContent>
        </Dialog>
    )
}
