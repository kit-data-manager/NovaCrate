import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSubContent
} from "@/components/ui/dropdown-menu"
import { useMemo } from "react"
import { Binary, Calendar, CalendarClock, Clock9, Diff, LinkIcon, Type } from "lucide-react"
import { PropertyEditorTypes } from "@/components/editor/property-editor"
import { usePropertyCanBe } from "@/components/editor/property-hooks"

export default function TypeSelectDropdown(props: {
    sub?: boolean
    propertyCanBe: ReturnType<typeof usePropertyCanBe>
    onPropertyTypeSelect(type: PropertyEditorTypes): void
}) {
    const Content = useMemo(() => {
        return props.sub ? DropdownMenuSubContent : DropdownMenuContent
    }, [props.sub])

    return (
        <Content>
            {props.propertyCanBe.canBeText ? (
                <DropdownMenuItem
                    onClick={() => props.onPropertyTypeSelect(PropertyEditorTypes.Text)}
                >
                    <Type className="size-4 mr-2" /> Text
                </DropdownMenuItem>
            ) : null}
            {props.propertyCanBe.canBeNumber ? (
                <DropdownMenuItem
                    onClick={() => props.onPropertyTypeSelect(PropertyEditorTypes.Number)}
                >
                    <Diff className="size-4 mr-2" /> Number
                </DropdownMenuItem>
            ) : null}
            {props.propertyCanBe.canBeBoolean ? (
                <DropdownMenuItem
                    onClick={() => props.onPropertyTypeSelect(PropertyEditorTypes.Boolean)}
                >
                    <Binary className="size-4 mr-2" /> Boolean
                </DropdownMenuItem>
            ) : null}
            {props.propertyCanBe.canBeTime ? (
                <DropdownMenuItem
                    onClick={() => props.onPropertyTypeSelect(PropertyEditorTypes.Time)}
                >
                    <Clock9 className="size-4 mr-2" /> Time
                </DropdownMenuItem>
            ) : null}
            {props.propertyCanBe.canBeDate ? (
                <DropdownMenuItem
                    onClick={() => props.onPropertyTypeSelect(PropertyEditorTypes.Date)}
                >
                    <Calendar className="size-4 mr-2" /> Date
                </DropdownMenuItem>
            ) : null}
            {props.propertyCanBe.canBeDateTime ? (
                <DropdownMenuItem
                    onClick={() => props.onPropertyTypeSelect(PropertyEditorTypes.DateTime)}
                >
                    <CalendarClock className="size-4 mr-2" /> Date and Time
                </DropdownMenuItem>
            ) : null}
            {props.propertyCanBe.canBeReference ? (
                <DropdownMenuItem
                    onClick={() => props.onPropertyTypeSelect(PropertyEditorTypes.Reference)}
                >
                    <LinkIcon className="size-4 mr-2" /> Reference
                </DropdownMenuItem>
            ) : null}
        </Content>
    )
}
