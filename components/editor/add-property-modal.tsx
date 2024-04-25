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
import { useCallback, useMemo } from "react"
import { PropertyEditorTypes } from "@/components/editor/property-editor"
import { usePropertyCanBe } from "@/components/editor/property-hooks"
import { propertyNameReadable } from "@/lib/utils"

export interface PossibleProperty {
    propertyName: string
    range: string[]
    rangeReadable: string[]
    comment: SchemaNode["comment"]
}

function AddPropertyModalEntry({
    property,
    onSelect
}: {
    property: PossibleProperty
    onSelect: (propertyName: string, propertyType: PropertyEditorTypes) => void
}) {
    const { canBeReference } = usePropertyCanBe(property.range)

    const readableName = useMemo(() => {
        return propertyNameReadable(property.propertyName)
    }, [property.propertyName])

    return (
        <CommandItem
            className="text-md"
            key={property.propertyName}
            value={property.propertyName}
            onSelect={(v) =>
                onSelect(
                    v,
                    canBeReference ? PropertyEditorTypes.Reference : PropertyEditorTypes.Text
                )
            }
        >
            <div className="flex flex-col max-w-full w-full py-1">
                <div className="flex justify-between">
                    <div>{readableName}</div>
                    <div className="text-sm text-muted-foreground">
                        {property.rangeReadable.join(", ")}
                    </div>
                </div>
                <div className="truncate text-xs">
                    <span>{property.comment + ""}</span>
                </div>
            </div>
        </CommandItem>
    )
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
        (propertyName: string, propertyType: PropertyEditorTypes) => {
            onOpenChange(false)
            onPropertyAdd(
                propertyName,
                propertyType === PropertyEditorTypes.Reference ? [{ "@id": "" }] : [""]
            )
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
                                possibleProperties.map((property) => {
                                    return (
                                        <AddPropertyModalEntry
                                            key={property.propertyName}
                                            property={property}
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

                <div className="flex gap-2 items-center">
                    <Checkbox checked id="onlyShowAllowed-create" />
                    <label htmlFor="onlyShowMatching">Only show allowed Properties</label>
                </div>
            </DialogContent>
        </Dialog>
    )
}
