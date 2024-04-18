import { useContext, useMemo } from "react"
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
import { CrateDataContext } from "@/components/crate-data-provider"
import { toArray } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

export function SelectReferenceModal({
    open,
    onSelect,
    onOpenChange,
    propertyRange
}: {
    open: boolean
    onSelect: (ref: IReference) => void
    onOpenChange: (open: boolean) => void
    propertyRange?: string[]
}) {
    const { crateData, crateDataIsLoading } = useContext(CrateDataContext)

    const possibleEntities = useMemo(() => {
        if (!open || crateDataIsLoading || !crateData || !propertyRange) return []

        return crateData["@graph"].filter((entity) => {
            for (const type of toArray(entity["@type"])) {
                if (propertyRange.includes(type)) return true
            }

            return false
        })
    }, [crateData, crateDataIsLoading, open, propertyRange])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select Entity to Reference</DialogTitle>
                    <Command className="py-2">
                        <CommandInput placeholder="Search all matching entities..." />
                        <CommandList>
                            <CommandEmpty>No results found.</CommandEmpty>
                            <CommandGroup>
                                {open ? (
                                    possibleEntities.map((e) => {
                                        return (
                                            <CommandItem className="text-md" key={e["@id"]}>
                                                {e["@id"]}
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
                        <Checkbox checked id="onlyShowMatching-reference" />
                        <label htmlFor="onlyShowMatching">
                            Only show Entities of matching type
                        </label>
                    </div>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}
