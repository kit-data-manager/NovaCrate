import { ChangeEvent, memo, useCallback, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Clock9 } from "lucide-react"
import { SinglePropertyDropdown } from "@/components/editor/single-property-dropdown"
import { SlimClass } from "@/lib/schema-worker/helpers"
import { PropertyEditorTypes } from "@/components/editor/property-editor"
import { DateTime } from "luxon"

export const TimeField = memo(function TimeField({
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
            onChange(
                DateTime.fromISO(e.target.value).toISOTime({ suppressMilliseconds: true }) ||
                    e.target.value
            )
        },
        [onChange]
    )

    const parsedValue = useMemo(() => {
        return DateTime.fromISO(value)
            .toLocal()
            .toISOTime({ suppressMilliseconds: true, includeOffset: false })
    }, [value])

    return (
        <div className="flex w-full relative">
            <Clock9 className="w-4 h-4 absolute left-2.5 top-3 pointer-events-none text-muted-foreground" />
            <Input
                value={parsedValue || value}
                onChange={onInputChange}
                className="self-center rounded-r-none pl-9"
                type="time"
            />
            <SinglePropertyDropdown
                propertyRange={propertyRange}
                onModifyTextLikeProperty={onChange}
                onRemoveEntry={onRemoveEntry}
                onChangeType={onChangeType}
                propertyType={PropertyEditorTypes.Time}
            />
        </div>
    )
})
