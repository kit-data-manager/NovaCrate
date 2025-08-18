import { ChangeEvent, memo, useCallback, useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Diff } from "lucide-react"
import { SinglePropertyDropdown } from "@/components/editor/single-property-dropdown"
import { SlimClass } from "@/lib/schema-worker/helpers"
import { PropertyType } from "@/lib/property"

export const NumberField = memo(function NumberField({
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
            const parsed = parseFloat(e.target.value) + ""
            if (parsed && parsed.length > 0 && parsed !== "NaN") onChange(parsed)
            setLocalValueCopy(e.target.value)
        },
        [onChange]
    )

    useEffect(() => {
        setLocalValueCopy(value)
    }, [value])

    const onBlur = useCallback(() => {
        setLocalValueCopy(value)
    }, [value])

    return (
        <div className="flex w-full relative">
            <Diff className="size-4 absolute left-2.5 top-2.5 pointer-events-none text-muted-foreground" />
            <Input
                value={localValueCopy}
                onChange={onInputChange}
                className="self-center rounded-r-none pl-9"
                type="number"
                onBlur={onBlur}
            />
            <SinglePropertyDropdown
                propertyRange={propertyRange}
                onModifyTextLikeProperty={onChange}
                onRemoveEntry={onRemoveEntry}
                onChangeType={onChangeType}
                propertyType={PropertyType.Number}
            />
        </div>
    )
})
