import { memo, useCallback, useEffect, useRef, useState } from "react"
import { SlimClass } from "@/lib/crate-verify/helpers"
import { PropertyEditorTypes } from "@/components/editor/property-editor"
import { usePropertyCanBe } from "@/components/editor/property-hooks"
import { DateField, getDefaultDate } from "@/components/editor/text-fields/date-field"
import { TextField } from "@/components/editor/text-fields/text-field"

function propertyCanBeToInputType({
    canBeDate,
    canBeDateTime,
    canBeNumber,
    canBeTime,
    canBeBoolean
}: ReturnType<typeof usePropertyCanBe>) {
    if (canBeDate) return PropertyEditorTypes.Date
    if (canBeDateTime) return PropertyEditorTypes.DateTime
    if (canBeNumber) return PropertyEditorTypes.Number
    if (canBeTime) return PropertyEditorTypes.Time
    if (canBeBoolean) return PropertyEditorTypes.Boolean

    return PropertyEditorTypes.Text
}

function shouldResetInputType(
    {
        canBeDate,
        canBeDateTime,
        canBeNumber,
        canBeTime,
        canBeBoolean
    }: ReturnType<typeof usePropertyCanBe>,
    currentType: PropertyEditorTypes
) {
    if (!canBeDate && currentType === PropertyEditorTypes.Date) return true
    if (!canBeDateTime && currentType === PropertyEditorTypes.DateTime) return true
    if (!canBeTime && currentType === PropertyEditorTypes.Time) return true
    if (!canBeBoolean && currentType === PropertyEditorTypes.Boolean) return true
    if (!canBeNumber && currentType === PropertyEditorTypes.Number) return true

    return false
}

export const TextBaseField = memo(function TextBaseField({
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
    const canBe = usePropertyCanBe(propertyRange, value)
    const propertyRangeRef = useRef(propertyRange)

    const [inputType, setInputType] = useState(propertyCanBeToInputType(canBe))

    useEffect(() => {
        // Text field cant be a reference, so change it to a reference field
        // In reality this effect should never execute
        if (inputType === PropertyEditorTypes.Reference) {
            onChangeType(PropertyEditorTypes.Reference)
        }
    }, [inputType, onChangeType])

    useEffect(() => {
        if (
            (!propertyRangeRef.current && propertyRange) || // propertyRange just became available
            shouldResetInputType(canBe, inputType) // Current input type no longer sensible (may happen on revert)
        ) {
            setInputType(propertyCanBeToInputType(canBe))
        }
        propertyRangeRef.current = propertyRange
    }, [canBe, inputType, propertyRange])

    const onLocalChangeType = useCallback(
        (type: PropertyEditorTypes) => {
            if (type === PropertyEditorTypes.Text) {
                setInputType(PropertyEditorTypes.Text)
            } else if (type === PropertyEditorTypes.Date) {
                if (!canBe.canBeDate) onChange(getDefaultDate())
                setInputType(PropertyEditorTypes.Date)
            } else {
                onChangeType(type)
            }
        },
        [onChange, onChangeType]
    )

    switch (inputType) {
        case PropertyEditorTypes.Date:
            return (
                <DateField
                    value={value}
                    onChange={onChange}
                    onChangeType={onLocalChangeType}
                    onRemoveEntry={onRemoveEntry}
                    propertyRange={propertyRange}
                />
            )
        default:
        case PropertyEditorTypes.Text:
            return (
                <TextField
                    value={value}
                    onChange={onChange}
                    onChangeType={onLocalChangeType}
                    onRemoveEntry={onRemoveEntry}
                    propertyRange={propertyRange}
                />
            )
    }
})
