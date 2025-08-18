import { memo, useCallback, useEffect, useRef, useState } from "react"
import { SlimClass } from "@/lib/schema-worker/helpers"
import { usePropertyCanBe } from "@/components/editor/property-hooks"
import { DateField } from "@/components/editor/text-fields/date-field"
import { TextField } from "@/components/editor/text-fields/text-field"
import { BooleanField } from "@/components/editor/text-fields/boolean-field"
import { NumberField } from "@/components/editor/text-fields/number-field"
import { TimeField } from "@/components/editor/text-fields/time-field"
import { DateTimeField } from "@/components/editor/text-fields/datetime-field"
import { useDeferredValue } from "@/lib/hooks"
import { getDefaultDate, getPropertyTypeDefaultValue, PropertyType } from "@/lib/property"

function propertyCanBeToInputType({
    canBeDate,
    canBeDateTime,
    canBeNumber,
    canBeTime,
    canBeBoolean
}: ReturnType<typeof usePropertyCanBe>) {
    if (canBeDate) return PropertyType.Date
    if (canBeDateTime) return PropertyType.DateTime
    if (canBeNumber) return PropertyType.Number
    if (canBeTime) return PropertyType.Time
    if (canBeBoolean) return PropertyType.Boolean

    return PropertyType.Text
}

function shouldResetInputType(
    {
        canBeDate,
        canBeDateTime,
        canBeNumber,
        canBeTime,
        canBeBoolean
    }: ReturnType<typeof usePropertyCanBe>,
    currentType: PropertyType
) {
    if (!canBeDate && currentType === PropertyType.Date) return true
    if (!canBeDateTime && currentType === PropertyType.DateTime) return true
    if (!canBeTime && currentType === PropertyType.Time) return true
    if (!canBeBoolean && currentType === PropertyType.Boolean) return true
    if (!canBeNumber && currentType === PropertyType.Number) return true

    return false
}

export const TextBaseField = memo(function TextBaseField({
    value: _value,
    onChange: _onChange,
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
    const { unDeferredValue: value, deferredOnChange: onChange } = useDeferredValue(
        _value,
        _onChange
    )

    const canBe = usePropertyCanBe(propertyRange, value)
    const propertyRangeLoaded = useRef(false)

    const [inputType, setInputType] = useState(propertyCanBeToInputType(canBe))

    useEffect(() => {
        // Text field cant be a reference, so change it to a reference field
        // In reality this effect should never execute
        if (inputType === PropertyType.Reference) {
            onChangeType(PropertyType.Reference)
        }
    }, [inputType, onChangeType])

    useEffect(() => {
        if (
            (!propertyRangeLoaded.current && propertyRange) || // propertyRange just became available
            shouldResetInputType(canBe, inputType) // Current input type no longer sensible (may happen on revert)
        ) {
            setInputType(propertyCanBeToInputType(canBe))
        }

        if (propertyRange) propertyRangeLoaded.current = true
    }, [canBe, inputType, propertyRange])

    const onLocalChangeType = useCallback(
        (type: PropertyType) => {
            if (type === PropertyType.Text) {
                setInputType(PropertyType.Text)
            } else if (type === PropertyType.Date) {
                if (!canBe.canBeDate) onChange(getDefaultDate())
                setInputType(PropertyType.Date)
            } else if (type === PropertyType.Boolean) {
                if (!canBe.canBeBoolean)
                    onChange(getPropertyTypeDefaultValue(PropertyType.Boolean) as string)
                setInputType(PropertyType.Boolean)
            } else if (type === PropertyType.Number) {
                if (!canBe.canBeNumber)
                    onChange(getPropertyTypeDefaultValue(PropertyType.Number) as string)
                setInputType(PropertyType.Number)
            } else if (type === PropertyType.Time) {
                if (!canBe.canBeTime)
                    onChange(getPropertyTypeDefaultValue(PropertyType.Time) as string)
                setInputType(PropertyType.Time)
            } else if (type === PropertyType.DateTime) {
                if (!canBe.canBeDateTime)
                    onChange(getPropertyTypeDefaultValue(PropertyType.DateTime) as string)
                setInputType(PropertyType.DateTime)
            } else {
                onChangeType(type)
            }
        },
        [
            canBe.canBeBoolean,
            canBe.canBeDate,
            canBe.canBeDateTime,
            canBe.canBeNumber,
            canBe.canBeTime,
            onChange,
            onChangeType
        ]
    )

    switch (inputType) {
        case PropertyType.Date:
            return (
                <DateField
                    value={value}
                    onChange={onChange}
                    onChangeType={onLocalChangeType}
                    onRemoveEntry={onRemoveEntry}
                    propertyRange={propertyRange}
                />
            )
        case PropertyType.Boolean:
            return (
                <BooleanField
                    value={value}
                    onChange={onChange}
                    onChangeType={onLocalChangeType}
                    onRemoveEntry={onRemoveEntry}
                    propertyRange={propertyRange}
                />
            )
        case PropertyType.Number:
            return (
                <NumberField
                    value={value}
                    onChange={onChange}
                    onChangeType={onLocalChangeType}
                    onRemoveEntry={onRemoveEntry}
                    propertyRange={propertyRange}
                />
            )
        case PropertyType.Time:
            return (
                <TimeField
                    value={value}
                    onChange={onChange}
                    onChangeType={onLocalChangeType}
                    onRemoveEntry={onRemoveEntry}
                    propertyRange={propertyRange}
                />
            )
        case PropertyType.DateTime:
            return (
                <DateTimeField
                    value={value}
                    onChange={onChange}
                    onChangeType={onLocalChangeType}
                    onRemoveEntry={onRemoveEntry}
                    propertyRange={propertyRange}
                />
            )
        default:
        case PropertyType.Text:
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
