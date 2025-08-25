import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { memo } from "react"
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import TypeSelectDropdown from "@/components/editor/type-select-dropdown"
import { usePropertyCanBe } from "@/components/editor/property-hooks"
import { SlimClass } from "@/lib/schema-worker/helpers"
import { PropertyType } from "@/lib/property"

export const AddEntryDropdown = memo(function AddEntryDropdown(props: {
    propertyName: string
    propertyRange?: SlimClass[]
    onAddEntry(type: PropertyType): void
    another: boolean
}) {
    const propertyCanBe = usePropertyCanBe(props.propertyRange)

    if (props.propertyName === "@id") return null

    if (props.propertyName === "@type")
        return (
            <Button
                variant="link"
                id="add-property-dropdown-trigger"
                className="flex text items-center text-muted-foreground p-1 pb-0 mb-0 h-[30px]"
                onClick={() => props.onAddEntry(PropertyType.Type)}
            >
                <Plus className="w-3 h-3 mr-1" />
                <span className="text-xs">Add {props.another ? "another" : ""} type</span>
            </Button>
        )

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="link"
                    id="add-property-dropdown-trigger"
                    className="flex text items-center text-muted-foreground p-1 pb-0 mb-0 h-[30px]"
                >
                    <Plus className="w-3 h-3 mr-1" />
                    <span className="text-xs">Add {props.another ? "another" : ""} entry</span>
                </Button>
            </DropdownMenuTrigger>
            <TypeSelectDropdown
                propertyCanBe={propertyCanBe}
                onPropertyTypeSelect={props.onAddEntry}
                showFallback={props.propertyRange === undefined}
            />
        </DropdownMenu>
    )
})
