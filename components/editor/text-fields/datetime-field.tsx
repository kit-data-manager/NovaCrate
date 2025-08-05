import { ChangeEvent, memo, useCallback, useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { CalendarClock } from "lucide-react"
import { SinglePropertyDropdown } from "@/components/editor/single-property-dropdown"
import { SlimClass } from "@/lib/schema-worker/helpers"
import { DateTime } from "luxon"
import { PropertyType } from "@/lib/property"

export const DateTimeField = memo(function DateTimeField({
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
    const [localValueCopy, setLocalValueCopy] = useState("")

    const onInputChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const parsed = DateTime.fromISO(e.target.value).toISO({ suppressMilliseconds: true })
            if (parsed) onChange(parsed)
            setLocalValueCopy(e.target.value)
        },
        [onChange]
    )

    useEffect(() => {
        const parsed = DateTime.fromISO(value)
            .toLocal()
            .startOf("minute")
            .toISO({ includeOffset: false, suppressSeconds: true, suppressMilliseconds: true })
        setLocalValueCopy(parsed || value)
    }, [value])

    const onBlur = useCallback(() => {
        const parsed = DateTime.fromISO(value)
            .toLocal()
            .startOf("minute")
            .toISO({ includeOffset: false, suppressSeconds: true, suppressMilliseconds: true })
        setLocalValueCopy(parsed || value)
    }, [value])

    return (
        <div className="flex w-full relative">
            <CalendarClock className="size-4 absolute left-2.5 top-2.5 pointer-events-none text-muted-foreground" />
            <Input
                value={localValueCopy}
                onChange={onInputChange}
                className="self-center rounded-r-none pl-9"
                type="datetime-local"
                onBlur={onBlur}
            />
            <SinglePropertyDropdown
                propertyRange={propertyRange}
                onModifyTextLikeProperty={onChange}
                onRemoveEntry={onRemoveEntry}
                onChangeType={onChangeType}
                propertyType={PropertyType.DateTime}
            />
        </div>
    )
})
