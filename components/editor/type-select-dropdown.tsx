import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSubContent
} from "@/components/ui/dropdown-menu"
import { useMemo } from "react"
import { Binary, Calendar, CalendarClock, Clock9, LinkIcon, Type } from "lucide-react"
import { PropertyEditorTypes } from "@/components/editor/property-editor"

export default function TypeSelectDropdown(props: {
    sub?: boolean
    propertyRange?: string[]
    onPropertyTypeSelect(type: PropertyEditorTypes): void
}) {
    const Content = useMemo(() => {
        return props.sub ? DropdownMenuSubContent : DropdownMenuContent
    }, [props.sub])

    const canBeTime = useMemo(() => {
        return props.propertyRange?.includes("Time")
    }, [props.propertyRange])

    const canBeBoolean = useMemo(() => {
        return props.propertyRange?.includes("Boolean")
    }, [props.propertyRange])

    const canBeDateTime = useMemo(() => {
        return props.propertyRange?.includes("DateTime")
    }, [props.propertyRange])

    const canBeNumber = useMemo(() => {
        return props.propertyRange?.includes("Number")
    }, [props.propertyRange])

    const canBeDate = useMemo(() => {
        return props.propertyRange?.includes("Date")
    }, [props.propertyRange])

    const canBeText = useMemo(() => {
        return (
            props.propertyRange?.includes("Text") ||
            canBeTime ||
            canBeBoolean ||
            canBeDateTime ||
            canBeNumber ||
            canBeDate
        )
    }, [canBeBoolean, canBeDate, canBeDateTime, canBeNumber, canBeTime, props.propertyRange])

    return (
        <Content>
            {canBeText ? (
                <DropdownMenuItem
                    onClick={() => props.onPropertyTypeSelect(PropertyEditorTypes.Text)}
                >
                    <Type className="w-4 h-4 mr-2" /> Text
                </DropdownMenuItem>
            ) : null}
            {canBeNumber ? (
                <DropdownMenuItem
                    onClick={() => props.onPropertyTypeSelect(PropertyEditorTypes.Number)}
                >
                    Number
                </DropdownMenuItem>
            ) : null}
            {canBeBoolean ? (
                <DropdownMenuItem
                    onClick={() => props.onPropertyTypeSelect(PropertyEditorTypes.Boolean)}
                >
                    <Binary className="w-4 h-4 mr-2" /> Boolean
                </DropdownMenuItem>
            ) : null}
            {canBeTime ? (
                <DropdownMenuItem
                    onClick={() => props.onPropertyTypeSelect(PropertyEditorTypes.Time)}
                >
                    <Clock9 className="w-4 h-4 mr-2" /> Time
                </DropdownMenuItem>
            ) : null}
            {canBeDate ? (
                <DropdownMenuItem
                    onClick={() => props.onPropertyTypeSelect(PropertyEditorTypes.Date)}
                >
                    <Calendar className="w-4 h-4 mr-2" /> Date
                </DropdownMenuItem>
            ) : null}
            {canBeDateTime ? (
                <DropdownMenuItem
                    onClick={() => props.onPropertyTypeSelect(PropertyEditorTypes.DateTime)}
                >
                    <CalendarClock className="w-4 h-4 mr-2" /> Date and Time
                </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
                onClick={() => props.onPropertyTypeSelect(PropertyEditorTypes.Reference)}
            >
                <LinkIcon className="w-4 h-4 mr-2" /> Reference
            </DropdownMenuItem>
        </Content>
    )
}
