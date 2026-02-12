import React, { useCallback, useContext, useEffect, useMemo, useState } from "react"
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
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { getEntityDisplayName, isRoCrateMetadataEntity, toArray } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { EntityIcon } from "@/components/entity/entity-icon"
import { SlimClass } from "@/lib/schema-worker/helpers"
import { useEditorState } from "@/lib/state/editor-state"
import { CheckedState } from "@radix-ui/react-checkbox"
import HelpTooltip from "@/components/help-tooltip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import * as z from "zod/mini"
import { TriangleAlert } from "lucide-react"

function SelectReferenceModalEntry({
    entity,
    onSelect
}: {
    entity: IEntity
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
    const crateContext = useEditorState((store) => store.crateContext)
    const rootEntityId = useEditorState((store) => store.getRootEntityId())

    const [isReferenceUrl, setIsReferenceUrl] = useState(false)
    const [referenceUrl, setReferenceUrl] = useState("")
    const [isValidReferenceUrl, setIsValidReferenceUrl] = useState(true)
    const [onlyShowAllowed, setOnlyShowAllowed] = useState(true)

    useEffect(() => {
        try {
            z.url().parse(referenceUrl)
            setIsValidReferenceUrl(true)
        } catch {
            setIsValidReferenceUrl(false)
        }
    }, [referenceUrl])

    const onCheckOnlyShowAllowed = useCallback((state: CheckedState) => {
        setOnlyShowAllowed(typeof state === "string" ? true : state)
    }, [])

    const onCheckIsReferenceUrl = useCallback((state: CheckedState) => {
        setIsReferenceUrl(typeof state === "string" ? true : state)
    }, [])

    const propertyRangeIds = useMemo(() => {
        return propertyRange?.map((p) => p["@id"])
    }, [propertyRange])

    const possibleEntities = useMemo(() => {
        if (!open || crateDataIsLoading || !crateData) return []

        if (onlyShowAllowed && propertyRangeIds) {
            return crateData["@graph"]
                .filter((e) => e["@id"] !== rootEntityId)
                .filter((e) => !isRoCrateMetadataEntity(e))
                .filter((entity) => {
                    for (const type of toArray(entity["@type"])) {
                        const resolved = crateContext.resolve(type)
                        if (!resolved) continue
                        if (propertyRangeIds.includes(resolved)) return true
                    }

                    return false
                })
        } else {
            return crateData["@graph"]
        }
    }, [
        crateContext,
        crateData,
        crateDataIsLoading,
        onlyShowAllowed,
        open,
        propertyRangeIds,
        rootEntityId
    ])

    const onSelectAndClose = useCallback(
        (ref: IReference) => {
            onOpenChange(false)
            onSelect(ref)
        },
        [onOpenChange, onSelect]
    )

    const confirmIsReference = useCallback(() => {
        onSelectAndClose({
            "@id": referenceUrl
        })

        setIsReferenceUrl(false)
        setReferenceUrl("")
    }, [onSelectAndClose, referenceUrl])

    const handleReferenceUrlKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                confirmIsReference()
            }
        },
        [confirmIsReference]
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select Entity to Reference</DialogTitle>
                </DialogHeader>

                {isReferenceUrl ? (
                    <div className="my-1">
                        <Label>URL</Label>
                        <Input
                            placeholder={"https://..."}
                            value={referenceUrl}
                            onChange={(e) => setReferenceUrl(e.target.value)}
                            onKeyDown={handleReferenceUrlKeyDown}
                        />
                        <div className="flex items-center justify-between mt-2">
                            <div>
                                {!isValidReferenceUrl && (
                                    <span className="flex items-center text-warn">
                                        <TriangleAlert className="size-4 mr-1" /> Invalid URL
                                    </span>
                                )}
                            </div>
                            <Button onClick={confirmIsReference}>Confirm</Button>
                        </div>
                    </div>
                ) : (
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
                )}

                <div className="flex gap-2 items-center">
                    <Checkbox
                        checked={isReferenceUrl}
                        onCheckedChange={onCheckIsReferenceUrl}
                        id="isReferenceUrl-reference"
                    />
                    <label htmlFor="isReferenceUrl-reference">Reference external resource</label>
                </div>

                {propertyRangeIds && (
                    <div className="flex gap-2 items-center">
                        <Checkbox
                            checked={onlyShowAllowed}
                            onCheckedChange={onCheckOnlyShowAllowed}
                            id="onlyShowMatching-reference"
                        />
                        <label htmlFor="onlyShowMatching-reference">
                            Only show Entities of matching type{" "}
                            <HelpTooltip>
                                Only Entities that can be used in the current property will be
                                shown. Should only be deactivated by experts.
                            </HelpTooltip>
                        </label>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
