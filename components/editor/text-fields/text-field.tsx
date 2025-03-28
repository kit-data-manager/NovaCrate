import { ChangeEvent, memo, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { TypeIcon } from "lucide-react"
import { SinglePropertyDropdown } from "@/components/editor/single-property-dropdown"
import { SlimClass } from "@/lib/schema-worker/helpers"
import { PropertyEditorTypes } from "@/components/editor/property-editor"

export const TextField = memo(function TextField({
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
            onChange(e.target.value)
        },
        [onChange]
    )

    return (
        <div className="flex w-full relative">
            <TypeIcon className="w-4 h-4 absolute left-2.5 top-3 pointer-events-none text-muted-foreground" />
            <Input
                value={value}
                onChange={onInputChange}
                className="self-center rounded-r-none pl-9"
            />
            <SinglePropertyDropdown
                propertyRange={propertyRange}
                onModifyTextLikeProperty={onChange}
                onRemoveEntry={onRemoveEntry}
                onChangeType={onChangeType}
                propertyType={PropertyEditorTypes.Text}
            />
        </div>
    )
})
