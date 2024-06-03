import { ChangeEvent, memo, useCallback, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { CalendarClock, Clock9, TypeIcon } from "lucide-react"
import { SinglePropertyDropdown } from "@/components/editor/single-property-dropdown"
import { SlimClass } from "@/lib/crate-verify/helpers"
import { PropertyEditorTypes } from "@/components/editor/property-editor"
import { DateTime } from "luxon"

export const DateTimeField = memo(function DateTimeField({
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
            onChange(DateTime.fromISO(e.target.value).toISO() || e.target.value)
        },
        [onChange]
    )

    const parsedValue = useMemo(() => {
        const txt = DateTime.fromISO(value).toLocal().toISO()
        console.log(txt)
        return txt
    }, [])

    return (
        <div className="flex w-full relative">
            <CalendarClock className="w-4 h-4 absolute left-2.5 top-3 pointer-events-none text-muted-foreground" />
            <Input
                value={parsedValue || value}
                onChange={onInputChange}
                className="self-center rounded-r-none pl-9"
                type="datetime-local"
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
