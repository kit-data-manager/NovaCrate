import { ChangeEvent, memo, useCallback, useEffect, useState } from "react"
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
    const [localValueCopy, setLocalValueCopy] = useState("")

    const onInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const parsed = DateTime.fromISO(e.target.value).toISOTime({ suppressMilliseconds: true })
        if (parsed) setLocalValueCopy(parsed)
        setLocalValueCopy(e.target.value)
    }, [])

    useEffect(() => {
        const parsed = DateTime.fromISO(value)
            .toLocal()
            .toISOTime({ suppressMilliseconds: true, includeOffset: false })
        setLocalValueCopy(parsed || value)
    }, [value])

    const onBlur = useCallback(() => {
        const parsed = DateTime.fromISO(value)
            .toLocal()
            .toISOTime({ suppressMilliseconds: true, includeOffset: false })
        setLocalValueCopy(parsed || value)
    }, [value])

    return (
        <div className="flex w-full relative">
            <Clock9 className="size-4 absolute left-2.5 top-2.5 pointer-events-none text-muted-foreground" />
            <Input
                value={localValueCopy}
                onChange={onInputChange}
                onBlur={onBlur}
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
