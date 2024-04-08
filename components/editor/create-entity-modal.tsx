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
import { Skeleton } from "@/components/ui/skeleton"

export function CreateEntityModal({
    open,
    onEntityCreated,
    onOpenChange,
    restrictToClasses
}: {
    open: boolean
    onEntityCreated: (ref: IReference) => void
    onOpenChange: (open: boolean) => void
    restrictToClasses?: string[]
}) {
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
                                {restrictToClasses ? (
                                    restrictToClasses.map((e, i) => {
                                        return (
                                            <CommandItem className="text-md" key={e}>
                                                {e}
                                            </CommandItem>
                                        )
                                    })
                                ) : (
                                    <>
                                        <Skeleton className={"w-10 h-4"} />
                                    </>
                                )}
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
