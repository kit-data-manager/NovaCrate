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
import { SlimClass } from "@/lib/crate-verify/helpers"
import { useCallback, useContext, useMemo } from "react"
import { CrateEditorContext } from "@/components/crate-editor-provider"

function CreateEntityModalEntry({ slimClass }: { slimClass: SlimClass }) {
    const { crateContext } = useContext(CrateEditorContext)

    const readableName = useMemo(() => {
        return crateContext.reverse(slimClass["@id"]) || slimClass["@id"]
    }, [crateContext, slimClass])

    return (
        <CommandItem className="text-md" key={slimClass["@id"]}>
            <div className="flex flex-col max-w-full w-full py-1">
                <div className="flex justify-between">
                    <div>{readableName}</div>
                </div>
                <div className="truncate text-xs">
                    <span>{slimClass.comment + ""}</span>
                </div>
            </div>
        </CommandItem>
    )
}

export function CreateEntityModal({
    open,
    onEntityCreated,
    onOpenChange,
    restrictToClasses
}: {
    open: boolean
    onEntityCreated: (ref: IReference) => void
    onOpenChange: (open: boolean) => void
    restrictToClasses?: SlimClass[]
}) {
    const { addEntity } = useContext(CrateEditorContext)

    const onCreate = useCallback((classId: string) => {}, [])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select Class of new Entity</DialogTitle>
                </DialogHeader>

                <Command className="py-2" onSelect={(el) => {}}>
                    <CommandInput placeholder="Search all matching Classes..." />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {open && restrictToClasses ? (
                                restrictToClasses.map((e, i) => (
                                    <CreateEntityModalEntry key={e["@id"]} slimClass={e} />
                                ))
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
            </DialogContent>
        </Dialog>
    )
}
