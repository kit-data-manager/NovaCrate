import { useContextResolver } from "@/lib/hooks/hooks"
import { memo, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { SchemaWorker } from "@/components/providers/schema-worker-provider"
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
import { propertyCanBe, usePropertyCanBe } from "@/lib/hooks/property-can-be"
import { camelCaseReadable } from "@/lib/utils"
import { MarkdownComment } from "@/components/markdown-comment"
import HelpTooltip from "@/components/help-tooltip"
import useSWR from "swr"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { useProfileService } from "@/lib/hooks/use-profile-service"

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
    profileClasses,
    onlyReferences
}: {
    open: boolean
    onPropertySelect: (propertyName: string, canBe: ReturnType<typeof usePropertyCanBe>) => void
    typeArray: string[]
    profileClasses: EntityRule[]
    onlyReferences: boolean
}) {
    const [open, setOpen] = useState(_open)
    const resolver = useContextResolver()
    const { isReady: schemaWorkerReady, worker } = useContext(SchemaWorker)
    const [bypassRestrictions, setBypassRestrictions] = useState(false)
    const [ignoreProfile, setIgnoreProfile] = useState(false)
    const profileService = useProfileService()

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

        // Strategy:
        // 1. If this entity conforms to a profile (ProfileClass), then only display properties from conforming profiles
        // 2. If this entity does not conform to a profile, then display all properties that are allowed on the entity type (or all known properties if the user bypassed the restrictions)

        const profileProperties = profileService.getPropertiesFor(profileClasses)
        if (profileProperties.length > 0 && !ignoreProfile) {
            return profileProperties
                .map(
                    (property) =>
                        ({
                            propertyName: property.label,
                            comment: property.description,
                            range: property.rangeIncludes ?? [],
                            rangeReadable:
                                property.rangeIncludes
                                    ?.filter((id) => !id.startsWith("#"))
                                    .map((id) => resolver.reverse(id) ?? id) ?? []
                        }) satisfies PossibleProperty
                )
                .filter((property) =>
                    onlyReferences ? propertyCanBe(property.range).canBeReference : true
                )
        } else if (schemaWorkerReady) {
            const data = bypassRestrictions
                ? await worker.execute("getAllProperties", { onlyReferences })
                : await worker.execute(
                      "getPossibleEntityProperties",
                      types
                          .map((type) => resolver.resolve(type))
                          .filter((s) => typeof s === "string"),
                      { onlyReferences }
                  )
            return data
                .map((s) => {
                    return {
                        ...s,
                        range: s.range.map((r) => r["@id"]),
                        rangeReadable: s.range
                            .map((r) => r["@id"])
                            .map((r) => resolver.reverse(r))
                            .filter((r) => typeof r === "string"),
                        propertyName: resolver.reverse(s["@id"])
                    }
                })
                .filter((s) => typeof s.propertyName === "string") as PossibleProperty[]
        }
    }, [
        bypassRestrictions,
        typeArray,
        profileService,
        profileClasses,
        ignoreProfile,
        schemaWorkerReady,
        resolver,
        worker,
        onlyReferences
    ])

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
        schemaWorkerReady
            ? `possible-properties-${bypassRestrictions}-${ignoreProfile}-${typeArray.join(",")}`
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
            <div className="space-y-1">
                {profileClasses.length > 0 && (
                    <div className="flex gap-2 items-center">
                        <Checkbox
                            checked={ignoreProfile}
                            onCheckedChange={(state) =>
                                state === "indeterminate"
                                    ? setIgnoreProfile(true)
                                    : setIgnoreProfile(state)
                            }
                            id="ignoreProfile-addProperty"
                        />
                        <label htmlFor="ignoreProfile-addProperty">
                            Ignore Profile restrictions{" "}
                            <HelpTooltip>
                                Enabling this will ignore any property restrictions placed on the
                                current entity by any active profile.
                            </HelpTooltip>
                        </label>
                    </div>
                )}
                <div className="flex gap-2 items-center">
                    <Checkbox
                        disabled={profileClasses.length > 0 && !ignoreProfile}
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
            </div>
        </>
    )
}
