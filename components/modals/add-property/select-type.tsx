import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command"
import { usePropertyCanBe } from "@/components/editor/property-hooks"
import {
    ArrowLeft,
    Binary,
    Calendar,
    CalendarClock,
    Clock9,
    Diff,
    LinkIcon,
    TypeIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PropertyType } from "@/lib/property"

export function SelectType({
    onTypeSelect,
    possibleTypes,
    onBackClick
}: {
    onTypeSelect: (type: PropertyType) => void
    possibleTypes: ReturnType<typeof usePropertyCanBe>
    onBackClick(): void
}) {
    return (
        <>
            <DialogHeader>
                <DialogTitle>Select the Type of the Property</DialogTitle>
                <DialogDescription>You can always change the type later on.</DialogDescription>
            </DialogHeader>
            <Command className="py-2">
                <CommandInput autoFocus placeholder="Search..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup>
                        {possibleTypes.canBeText ? (
                            <CommandItem
                                value="text"
                                onSelect={() => onTypeSelect(PropertyType.Text)}
                            >
                                <TypeIcon className="size-4 mr-2" /> Text
                            </CommandItem>
                        ) : null}
                        {possibleTypes.canBeNumber ? (
                            <CommandItem
                                value="number"
                                onSelect={() => onTypeSelect(PropertyType.Number)}
                            >
                                <Diff className="size-4 mr-2" /> Number
                            </CommandItem>
                        ) : null}
                        {possibleTypes.canBeBoolean ? (
                            <CommandItem
                                value="boolean"
                                onSelect={() => onTypeSelect(PropertyType.Boolean)}
                            >
                                <Binary className="size-4 mr-2" /> Boolean
                            </CommandItem>
                        ) : null}
                        {possibleTypes.canBeTime ? (
                            <CommandItem
                                value="time"
                                onSelect={() => onTypeSelect(PropertyType.Time)}
                            >
                                <Clock9 className="size-4 mr-2" /> Time
                            </CommandItem>
                        ) : null}
                        {possibleTypes.canBeDate ? (
                            <CommandItem
                                value="date"
                                onSelect={() => onTypeSelect(PropertyType.Date)}
                            >
                                <Calendar className="size-4 mr-2" /> Date
                            </CommandItem>
                        ) : null}
                        {possibleTypes.canBeDateTime ? (
                            <CommandItem
                                value="date and time"
                                onSelect={() => onTypeSelect(PropertyType.DateTime)}
                            >
                                <CalendarClock className="size-4 mr-2" /> Date and Time
                            </CommandItem>
                        ) : null}
                        {possibleTypes.canBeReference ? (
                            <CommandItem
                                value="reference"
                                onSelect={() => onTypeSelect(PropertyType.Reference)}
                            >
                                <LinkIcon className="size-4 mr-2" /> Reference
                            </CommandItem>
                        ) : null}
                    </CommandGroup>
                </CommandList>
            </Command>
            <div>
                <Button variant="secondary" size="sm" onClick={onBackClick}>
                    <ArrowLeft className="size-4 mr-2" /> Back
                </Button>
            </div>
        </>
    )
}
