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

export function CreateEntityModal({
    open,
    onEntityCreated,
    onOpenChange,
    restrictToClasses
}: {
    open: boolean
    onEntityCreated: (ref: IReference) => void
    onOpenChange: (open: boolean) => void
    restrictToClasses: string[]
}) {
    const possibleEntities = useMemo(() => {
        if (restrictToClasses) {
            return restrictToClasses
        } else {
            return ["No", "Classes", "Known"]
        }
    }, [restrictToClasses])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select Class of new Entity</DialogTitle>
                    <Command className="py-2" onSelect={(el) => {}}>
                        <CommandInput placeholder="Search all matching Classes..." />
                        <CommandList>
                            <CommandEmpty>No results found.</CommandEmpty>
                            <CommandGroup>
                                {possibleEntities.map((e, i) => {
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
                        <Checkbox checked id="onlyShowAllowed-create" />
                        <label htmlFor="onlyShowMatching">Only show allowed Classes</label>
                    </div>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}
