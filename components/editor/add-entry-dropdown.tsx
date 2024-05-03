import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { memo, useMemo } from "react"
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import TypeSelectDropdown from "@/components/editor/type-select-dropdown"
import { PropertyEditorTypes } from "@/components/editor/property-editor"
import { usePropertyCanBe } from "@/components/editor/property-hooks"
import { SlimClass } from "@/lib/crate-verify/helpers"

export const AddEntryDropdown = memo(function AddEntryDropdown(props: {
    propertyName: string
    propertyRange?: SlimClass[]
    onAddEntry(type: PropertyEditorTypes): void
    another: boolean
}) {
    const entryName = useMemo(() => {
        if (props.propertyName === "@type") {
            return "type"
        } else return "entry"
    }, [props.propertyName])

    const propertyCanBe = usePropertyCanBe(props.propertyRange)

    if (props.propertyName === "@id" || props.propertyName === "@type") return null

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="link"
                    className="flex text items-center text-muted-foreground p-1 pb-0 mb-0 h-[30px]"
                >
                    <Plus className="w-3 h-3 mr-1" />
                    <span className="text-xs">
                        Add {props.another ? "another" : ""} {entryName}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <TypeSelectDropdown
                propertyCanBe={propertyCanBe}
                onPropertyTypeSelect={props.onAddEntry}
            />
        </DropdownMenu>
    )
})
