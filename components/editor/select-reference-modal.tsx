import { useMemo } from "react"
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

export function SelectReferenceModal({
    open,
    onSelect,
    onOpenChange
}: {
    open: boolean
    onSelect: (ref: Reference) => void
    onOpenChange: (open: boolean) => void
}) {
    const possibleEntities = useMemo(() => {
        return ["One", "Two", "Three"]
    }, [])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select Entity to Reference</DialogTitle>
                    <Command className="py-2" onSelect={(el) => {}}>
                        <CommandInput placeholder="Search all matching entities..." />
                        <CommandList>
                            <CommandEmpty>No results found.</CommandEmpty>
                            <CommandGroup>
                                {possibleEntities.map((e) => {
                                    return (
                                        <CommandItem className="text-md" key={e}>
                                            {e}
                                        </CommandItem>
                                    )
                                })}
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
