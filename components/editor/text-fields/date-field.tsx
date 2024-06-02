import { ChangeEvent, memo, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Calendar, TypeIcon } from "lucide-react"
import { SinglePropertyDropdown } from "@/components/editor/single-property-dropdown"
import { SlimClass } from "@/lib/crate-verify/helpers"
import { PropertyEditorTypes } from "@/components/editor/property-editor"

export function getDefaultDate() {
    const today = new Date()
    const dd = String(today.getDate()).padStart(2, "0")
    const mm = String(today.getMonth() + 1).padStart(2, "0") //January is 0!
    const yyyy = today.getFullYear()

    return yyyy + "-" + mm + "-" + dd
}

export const DateField = memo(function DateField({
    value,
    onChange,
    onChangeType,
    propertyRange,
    onRemoveEntry
}: {
    value: string
    onChange: (value: string) => void
    onChangeType: (type: PropertyEditorTypes) => void
    propertyRange?: SlimClass[]
    onRemoveEntry: () => void
}) {
    const onInputChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            onChange(e.target.value || getDefaultDate())
        },
        [onChange]
    )

    return (
        <div className="flex w-full relative">
            <Calendar className="w-4 h-4 absolute left-2.5 top-3 pointer-events-none text-muted-foreground" />
            <Input
                value={value}
                type="date"
                onChange={onInputChange}
                className="self-center rounded-r-none pl-9"
            />
            <SinglePropertyDropdown
                propertyRange={propertyRange}
                onModifyTextLikeProperty={onChange}
                onRemoveEntry={onRemoveEntry}
                onChangeType={onChangeType}
            />
        </div>
    )
})
