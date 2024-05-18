import { SlimClass } from "@/lib/crate-verify/helpers"
import { useEditorState } from "@/components/editor-state"
import React, { useCallback, useContext, useEffect, useState } from "react"
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
import { CreateEntityModalEntry } from "@/components/create-entity/modal-entry"
import { CrateVerifyContext } from "@/components/crate-verify-provider"
import { useAsync } from "@/components/use-async"
import { Error } from "@/components/error"

export function TypeSelect({
    open,
    restrictToClasses,
    onTypeSelect
}: {
    open: boolean
    restrictToClasses?: SlimClass[]
    onTypeSelect: (value: string) => void
}) {
    const crateContext = useEditorState.useCrateContext()
    const { getAllClasses } = useContext(CrateVerifyContext)
    const [bypassRestrictions, setBypassRestrictions] = useState(false)

    const toggleRestrictions = useCallback((state: boolean | "indeterminate") => {
        setBypassRestrictions(state === "indeterminate" ? true : !state)
    }, [])

    const typesResolver = useCallback(async () => {
        if (bypassRestrictions || !restrictToClasses) {
            const classUrls = crateContext.getAllClasses()
            return (await getAllClasses()).filter((slimClass) => {
                return classUrls.includes(slimClass["@id"])
            })
        } else {
            if (restrictToClasses) {
                return restrictToClasses.filter((c) => crateContext.reverse(c["@id"])) // Reversible classes are known via specification
            } else return []
        }
    }, [bypassRestrictions, crateContext, getAllClasses, restrictToClasses])

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

    return (
        <>
            <Error title="Error while getting list of possible classes" error={error} />
            <Command className="py-2">
                <CommandInput placeholder="Search all matching Classes..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup>
                        {open && !isPending && types ? (
                            types.map((e) => (
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
                                <Skeleton className={"w-full h-8"} />
                            </CommandItem>
                        )}
                    </CommandGroup>
                </CommandList>
            </Command>
            <div className="flex gap-2 items-center">
                <Checkbox
                    checked={!bypassRestrictions}
                    onCheckedChange={toggleRestrictions}
                    id="onlyShowAllowed-create"
                />
                <label htmlFor="onlyShowAllowed-create">Only show valid Types</label>
            </div>
        </>
    )
}
