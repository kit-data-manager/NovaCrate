import { memo, useCallback } from "react"
import { SinglePropertyDropdown } from "@/components/editor/single-property-dropdown"
import { SlimClass } from "@/lib/schema-worker/helpers"
import { Switch } from "@/components/ui/switch"
import { PropertyType } from "@/lib/property"

export const BooleanField = memo(function DateField({
    value,
    onChange,
    onChangeType,
    propertyRange,
    onRemoveEntry
}: {
    value: string
    onChange: (value: string) => void
    onChangeType: (type: PropertyType) => void
    propertyRange?: SlimClass[]
    onRemoveEntry: () => void
}) {
    const onInputChange = useCallback(
        (checked: boolean) => {
            onChange(checked ? "true" : "false")
        },
        [onChange]
    )

    return (
        <div className="flex w-full relative">
            <div className="self-center rounded-r-none grow pl-2">
                <Switch checked={value == "true"} onCheckedChange={onInputChange} />
                <div className="ml-2 inline-block">{value == "true" ? "True" : "False"}</div>
            </div>
            <SinglePropertyDropdown
                propertyRange={propertyRange}
                onModifyTextLikeProperty={onChange}
                onRemoveEntry={onRemoveEntry}
                onChangeType={onChangeType}
                triggerClassName="border-l rounded-md"
                propertyType={PropertyType.Boolean}
            />
        </div>
    )
})
