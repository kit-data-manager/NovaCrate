import { ChangeEvent, memo, useCallback, useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Calendar } from "lucide-react"
import { SinglePropertyDropdown } from "@/components/editor/single-property-dropdown"
import { SlimClass } from "@/lib/schema-worker/helpers"
import { PropertyEditorTypes } from "@/components/editor/property-editor"
import { DateTime } from "luxon"

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
    const [localValueCopy, setLocalValueCopy] = useState("")

    const onInputChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const parsed = DateTime.fromISO(e.target.value).toISODate()
            if (parsed) onChange(parsed)

            setLocalValueCopy(parsed || e.target.value)
        },
        [onChange]
    )

    useEffect(() => {
        const parsedValue = DateTime.fromISO(value).toLocal().toISODate()
        if (parsedValue) setLocalValueCopy(parsedValue)
    }, [value])

    const onBlur = useCallback(() => {
        setLocalValueCopy(DateTime.fromISO(value).toLocal().toISODate() || getDefaultDate())
    }, [value])

    return (
        <div className="flex w-full relative">
            <Calendar className="size-4 absolute left-2.5 top-2.5 pointer-events-none text-muted-foreground" />
            <Input
                value={localValueCopy}
                type="date"
                onChange={onInputChange}
                className={`self-center rounded-r-none pl-9`}
                onBlur={onBlur}
            />
            <SinglePropertyDropdown
                propertyRange={propertyRange}
                onModifyTextLikeProperty={onChange}
                onRemoveEntry={onRemoveEntry}
                onChangeType={onChangeType}
                propertyType={PropertyEditorTypes.Date}
            />
        </div>
    )
})
