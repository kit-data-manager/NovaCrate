import { useEditorState } from "@/lib/state/editor-state"
import { memo, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { SchemaWorker } from "@/components/providers/crate-verify-provider"
import { CheckedState } from "@radix-ui/react-checkbox"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Error } from "@/components/error"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { PossibleProperty } from "@/components/modals/add-property/add-property-modal"
import { usePropertyCanBe } from "@/components/editor/property-hooks"
import { camelCaseReadable } from "@/lib/utils"
import { MarkdownComment } from "@/components/markdown-comment"
import HelpTooltip from "@/components/help-tooltip"
import useSWR from "swr"

const AddPropertyModalEntry = memo(function AddPropertyModalEntry({
    property,
    onSelect
}: {
    property: PossibleProperty
    onSelect: (propertyName: string, canBe: ReturnType<typeof usePropertyCanBe>) => void
}) {
    const canBe = usePropertyCanBe(property.range)

    const readableName = useMemo(() => {
        return camelCaseReadable(property.propertyName)
    }, [property.propertyName])

    return (
        <CommandItem
            className="text-md"
            key={property.propertyName}
            value={readableName}
            onSelect={() => onSelect(property.propertyName, canBe)}
        >
            <div className="flex flex-col max-w-full w-full py-1">
                <div className="flex justify-between">
                    <div>{readableName}</div>
                    <div className="text-sm text-muted-foreground">
                        {property.rangeReadable.join(", ")}
                    </div>
                </div>
                <div>
                    <span className="text-xs max-w-full line-clamp-1">
                        <MarkdownComment comment={property.comment} />
                    </span>
                </div>
            </div>
        </CommandItem>
    )
})

export function SelectProperty({
    open: _open,
    onPropertySelect,
    typeArray,
    onlyReferences
}: {
    open: boolean
    onPropertySelect: (propertyName: string, canBe: ReturnType<typeof usePropertyCanBe>) => void
    typeArray: string[]
    onlyReferences: boolean
}) {
    const [open, setOpen] = useState(_open)
    const crateContext = useEditorState((store) => store.crateContext)
    const { isReady: crateVerifyReady, worker } = useContext(SchemaWorker)
    const [bypassRestrictions, setBypassRestrictions] = useState(false)

    useEffect(() => {
        if (_open) {
            setOpen(true)
        } else {
            setTimeout(() => {
                setOpen(false)
            }, 200)
        }
    }, [_open])

    const possiblePropertiesResolver = useCallback(async () => {
        const types = bypassRestrictions ? ["*"] : typeArray

        if (crateVerifyReady) {
            const data = bypassRestrictions
                ? await worker.execute("getAllProperties", { onlyReferences })
                : await worker.execute(
                      "getPossibleEntityProperties",
                      types
                          .map((type) => crateContext.resolve(type))
                          .filter((s) => typeof s === "string") as string[],
                      { onlyReferences }
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
    }, [bypassRestrictions, crateContext, crateVerifyReady, onlyReferences, typeArray, worker])

    const handleBypassCheckedChange = useCallback((s: CheckedState) => {
        if (!s) {
            setBypassRestrictions(true)
        } else setBypassRestrictions(false)
    }, [])

    const {
        data: possibleProperties,
        error: possiblePropertiesError,
        isLoading: possiblePropertiesPending
    } = useSWR(
        crateVerifyReady
            ? `possible-properties-${bypassRestrictions}-${typeArray.join(",")}`
            : null,
        possiblePropertiesResolver
    )

    return (
        <>
            <DialogHeader>
                <DialogTitle>Select a Property</DialogTitle>
            </DialogHeader>
            <Error
                className="mt-4"
                title="Error while determining possible properties"
                error={possiblePropertiesError}
            />
            <Command className="py-2">
                <CommandInput placeholder="Search..." autoFocus />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup>
                        {open && possibleProperties && !possiblePropertiesPending ? (
                            possibleProperties.map((property) => {
                                return (
                                    <AddPropertyModalEntry
                                        key={property.propertyName}
                                        property={property}
                                        onSelect={onPropertySelect}
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
                <label htmlFor="onlyShowAllowed-create">
                    Only show matching Properties{" "}
                    <HelpTooltip>
                        When enabled, only properties that are allowed on the current type are
                        shown. Should only be deactivated by experts.
                    </HelpTooltip>
                </label>
            </div>
        </>
    )
}
