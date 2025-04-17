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
import { PropertyEditorTypes } from "@/components/editor/property-editor"
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

export function SelectType({
    onTypeSelect,
    possibleTypes,
    onBackClick
}: {
    onTypeSelect: (type: PropertyEditorTypes) => void
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
                                onSelect={() => onTypeSelect(PropertyEditorTypes.Text)}
                            >
                                <TypeIcon className="size-4 mr-2" /> Text
                            </CommandItem>
                        ) : null}
                        {possibleTypes.canBeNumber ? (
                            <CommandItem
                                value="number"
                                onSelect={() => onTypeSelect(PropertyEditorTypes.Number)}
                            >
                                <Diff className="size-4 mr-2" /> Number
                            </CommandItem>
                        ) : null}
                        {possibleTypes.canBeBoolean ? (
                            <CommandItem
                                value="boolean"
                                onSelect={() => onTypeSelect(PropertyEditorTypes.Boolean)}
                            >
                                <Binary className="size-4 mr-2" /> Boolean
                            </CommandItem>
                        ) : null}
                        {possibleTypes.canBeTime ? (
                            <CommandItem
                                value="time"
                                onSelect={() => onTypeSelect(PropertyEditorTypes.Time)}
                            >
                                <Clock9 className="size-4 mr-2" /> Time
                            </CommandItem>
                        ) : null}
                        {possibleTypes.canBeDate ? (
                            <CommandItem
                                value="date"
                                onSelect={() => onTypeSelect(PropertyEditorTypes.Date)}
                            >
                                <Calendar className="size-4 mr-2" /> Date
                            </CommandItem>
                        ) : null}
                        {possibleTypes.canBeDateTime ? (
                            <CommandItem
                                value="date and time"
                                onSelect={() => onTypeSelect(PropertyEditorTypes.DateTime)}
                            >
                                <CalendarClock className="size-4 mr-2" /> Date and Time
                            </CommandItem>
                        ) : null}
                        {possibleTypes.canBeReference ? (
                            <CommandItem
                                value="reference"
                                onSelect={() => onTypeSelect(PropertyEditorTypes.Reference)}
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
