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
import { memo, useCallback, useContext, useMemo, useState } from "react"
import { PropertyEditorTypes } from "@/components/editor/property-editor"
import { usePropertyCanBe } from "@/components/editor/property-hooks"
import { camelCaseReadable } from "@/lib/utils"
import { useAsync } from "@/components/use-async"
import { Error } from "@/components/error"
import { useEditorState } from "@/components/editor-state"
import { CrateVerifyContext } from "@/components/crate-verify-provider"
import { CheckedState } from "@radix-ui/react-checkbox"

export interface PossibleProperty {
    propertyName: string
    range: string[]
    rangeReadable: string[]
    comment: SchemaNode["comment"]
}

const AddPropertyModalEntry = memo(function AddPropertyModalEntry({
    property,
    onSelect
}: {
    property: PossibleProperty
    onSelect: (propertyName: string, propertyType: PropertyEditorTypes) => void
}) {
    const { canBeText } = usePropertyCanBe(property.range)

    const readableName = useMemo(() => {
        return camelCaseReadable(property.propertyName)
    }, [property.propertyName])

    return (
        <CommandItem
            className="text-md"
            key={property.propertyName}
            value={readableName}
            onSelect={() =>
                onSelect(
                    property.propertyName,
                    canBeText ? PropertyEditorTypes.Text : PropertyEditorTypes.Reference
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
})

export function AddPropertyModal({
    open,
    onPropertyAdd,
    onOpenChange,
    typeArray
}: {
    open: boolean
    onPropertyAdd: (propertyName: string, values?: FlatEntitySinglePropertyTypes[]) => void
    onOpenChange: (open: boolean) => void
    typeArray: string[]
}) {
    const crateContext = useEditorState.useCrateContext()
    const {
        isReady: crateVerifyReady,
        getClassProperties,
        getAllProperties
    } = useContext(CrateVerifyContext)
    const [bypassRestrictions, setBypassRestrictions] = useState(false)

    const onSelect = useCallback(
        (propertyName: string, propertyType: PropertyEditorTypes) => {
            onOpenChange(false)
            console.log(propertyType)
            onPropertyAdd(
                propertyName,
                propertyType === PropertyEditorTypes.Reference ? [{ "@id": "" }] : [""]
            )
        },
        [onOpenChange, onPropertyAdd]
    )

    const possiblePropertiesResolver = useCallback(
        async (types: string[]) => {
            if (crateVerifyReady) {
                const data = bypassRestrictions
                    ? await getAllProperties()
                    : await getClassProperties(
                          types
                              .map((type) => crateContext.resolve(type))
                              .filter((s) => typeof s === "string") as string[]
                      )
                return data
                    .map((s) => {
                        return {
                            ...s,
                            range: s.range.map((r) => r["@id"]),
                            rangeReadable: s.range
                                .map((r) => r["@id"])
                                .map((r) => crateContext.reverse(r))
                                .filter((r) => typeof r === "string"),
                            propertyName: crateContext.reverse(s["@id"])
                        }
                    })
                    .filter((s) => typeof s.propertyName === "string") as PossibleProperty[]
            }
        },
        [bypassRestrictions, crateContext, crateVerifyReady, getAllProperties, getClassProperties]
    )

    const handleBypassCheckedChange = useCallback((s: CheckedState) => {
        if (!s) {
            setBypassRestrictions(true)
        } else setBypassRestrictions(false)
    }, [])

    const {
        data: possibleProperties,
        error: possiblePropertiesError,
        isPending: possiblePropertiesPending
    } = useAsync(
        crateVerifyReady ? (bypassRestrictions ? ["*"] : typeArray) : null,
        possiblePropertiesResolver
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select a Property</DialogTitle>
                </DialogHeader>

                <Error
                    className="mt-4"
                    text={
                        possiblePropertiesError
                            ? "Error while determining properties: " + possiblePropertiesError
                            : ""
                    }
                />

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
                    <Checkbox
                        checked={!bypassRestrictions}
                        onCheckedChange={handleBypassCheckedChange}
                        id="onlyShowAllowed-create"
                    />
                    <label htmlFor="onlyShowAllowed-create">Only show allowed Properties</label>
                </div>
            </DialogContent>
        </Dialog>
    )
}
