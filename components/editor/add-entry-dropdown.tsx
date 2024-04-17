import { EntityEditorProperty } from "@/components/editor/entity-editor"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useMemo } from "react"
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import TypeSelectDropdown from "@/components/editor/type-select-dropdown"
import { PropertyEditorTypes } from "@/components/editor/property-editor"

export default function AddEntryDropdown(props: {
    property: EntityEditorProperty
    propertyRange?: string[]
    onAddEntry(type: PropertyEditorTypes): void
}) {
    const entryName = useMemo(() => {
        if (props.property.propertyName === "@type") {
            return "type"
        } else return "entry"
    }, [props.property.propertyName])

    if (props.property.propertyName === "@id") return null

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="link"
                    className="flex text items-center text-muted-foreground p-1 pb-0 mb-0 h-[30px]"
                >
                    <Plus className="w-3 h-3 mr-1" />
                    <span className="text-xs">Add another {entryName}</span>
                </Button>
            </DropdownMenuTrigger>
            <TypeSelectDropdown
                propertyRange={props.propertyRange}
                onPropertyTypeSelect={props.onAddEntry}
            />
        </DropdownMenu>
    )
}
