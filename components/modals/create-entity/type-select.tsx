import { SlimClass } from "@/lib/schema-worker/helpers"
import { useEditorState } from "@/lib/state/editor-state"
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react"
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
import { CreateEntityModalEntry } from "@/components/modals/create-entity/modal-entry"
import { CrateVerifyContext } from "@/components/providers/crate-verify-provider"
import { Error } from "@/components/error"
import { Button } from "@/components/ui/button"
import { Blocks } from "lucide-react"
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAsync } from "@/lib/hooks"
import { COMMON_PROPERTIES } from "@/lib/constants"
import HelpTooltip from "@/components/help-tooltip"

export function TypeSelect({
    open,
    restrictToClasses,
    onTypeSelect,
    setFullTypeBrowser
}: {
    open: boolean
    restrictToClasses?: SlimClass[]
    onTypeSelect: (value: string) => void
    setFullTypeBrowser(open: boolean): void
}) {
    const crateContext = useEditorState.useCrateContext()
    const { worker } = useContext(CrateVerifyContext)
    const [bypassRestrictions, setBypassRestrictions] = useState(false)

    const toggleRestrictions = useCallback((state: boolean | "indeterminate") => {
        setBypassRestrictions(state === "indeterminate" ? true : !state)
    }, [])

    const typesResolver = useCallback(async () => {
        if (bypassRestrictions || !restrictToClasses) {
            const classUrls = crateContext.getAllClasses()
            return (await worker.execute("getAllClasses")).filter((slimClass) => {
                return classUrls.includes(slimClass["@id"])
            })
        } else {
            if (restrictToClasses) {
                return restrictToClasses.filter((c) => crateContext.reverse(c["@id"])) // Reversible classes are known via specification
            } else return []
        }
    }, [bypassRestrictions, crateContext, restrictToClasses, worker])

    const {
        data: types,
        isPending,
        error
    } = useAsync([bypassRestrictions, restrictToClasses], typesResolver)

    useEffect(() => {
        if (types && types.length === 1) {
            onTypeSelect(crateContext.reverse(types[0]["@id"]) || types[0]["@id"])
        }
    }, [onTypeSelect, types, crateContext])

    const commonTypes = useMemo(() => {
        return types?.filter((e) => COMMON_PROPERTIES.includes(e["@id"]))
    }, [types])

    const allTypes = useMemo(() => {
        return types?.filter((e) => !COMMON_PROPERTIES.includes(e["@id"]))
    }, [types])

    return (
        <>
            <DialogHeader>
                <DialogTitle>Select Entity Type</DialogTitle>

                <DialogDescription>
                    Search through all possible Types and select the one that fits your needs the
                    best. It is recommended to only show valid Types.
                </DialogDescription>
            </DialogHeader>

            <Error title="Error while getting list of possible types" error={error} />
            <Command className="py-2">
                <CommandInput placeholder="Search for a type..." autoFocus />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    {!commonTypes || commonTypes.length > 0 ? (
                        <CommandGroup heading="Common Types">
                            {open && !isPending && commonTypes ? (
                                commonTypes.map((e) => (
                                    <CreateEntityModalEntry
                                        key={e["@id"]}
                                        slimClass={e}
                                        onSelect={onTypeSelect}
                                        common
                                    />
                                ))
                            ) : (
                                <CommandItem className="flex flex-col gap-2">
                                    <Skeleton className={"w-full h-8"} />
                                    <Skeleton className={"w-full h-8"} />
                                </CommandItem>
                            )}
                        </CommandGroup>
                    ) : null}
                    <CommandGroup heading="All Types">
                        {open && !isPending && allTypes ? (
                            allTypes.map((e) => (
                                <CreateEntityModalEntry
                                    key={e["@id"]}
                                    slimClass={e}
                                    onSelect={onTypeSelect}
                                />
                            ))
                        ) : (
                            <CommandItem className="flex flex-col gap-2">
                                <Skeleton className={"w-full h-8"} />
                                <Skeleton className={"w-full h-8"} />
                            </CommandItem>
                        )}
                    </CommandGroup>
                </CommandList>
            </Command>
            <div className="flex justify-between items-center gap-2">
                <div className="flex gap-2 items-center">
                    {restrictToClasses ? (
                        <>
                            <Checkbox
                                checked={!bypassRestrictions}
                                onCheckedChange={toggleRestrictions}
                                id="onlyShowAllowed-create"
                            />
                            <label htmlFor="onlyShowAllowed-create">
                                Only show matching Types{" "}
                                <HelpTooltip>
                                    Only show Types that can be used for the current property.
                                    Should only be disabled by experts.
                                </HelpTooltip>
                            </label>
                        </>
                    ) : null}
                </div>

                <Button variant="secondary" onClick={() => setFullTypeBrowser(false)}>
                    <Blocks className="w-4 h-4 mr-2" /> Quick Select
                </Button>
            </div>
        </>
    )
}
