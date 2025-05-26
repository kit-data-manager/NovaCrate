import { memo, useCallback } from "react"
import { TypeField } from "@/components/editor/type-field"
import { IDField } from "@/components/editor/id-field"
import { isReference } from "@/lib/utils"
import { ReferenceField } from "@/components/editor/reference-field"
import { TextBaseField } from "@/components/editor/text-base-field"
import { PropertyEditorProps, PropertyEditorTypes } from "@/components/editor/property-editor"
import { SlimClass } from "@/lib/schema-worker/helpers"
import { Error } from "@/components/error"

export interface SinglePropertyEditorProps {
    entityId: string
    propertyName: string
    value: EntitySinglePropertyTypes
    valueIndex: number
    propertyRange?: SlimClass[]
    onModifyProperty: PropertyEditorProps["onModifyPropertyEntry"]
    onRemovePropertyEntry: PropertyEditorProps["onRemovePropertyEntry"]
}

export const SinglePropertyEditor = memo(function SinglePropertyEditor({
    entityId,
    propertyName,
    onModifyProperty,
    valueIndex,
    propertyRange,
    value,
    onRemovePropertyEntry
}: SinglePropertyEditorProps) {
    const onChange = useCallback(
        (newValue: EntitySinglePropertyTypes) => {
            onModifyProperty(propertyName, valueIndex, newValue)
        },
        [onModifyProperty, propertyName, valueIndex]
    )

    const onRemoveEntry = useCallback(() => {
        onRemovePropertyEntry(propertyName, valueIndex)
    }, [onRemovePropertyEntry, propertyName, valueIndex])

    const onChangeType = useCallback(
        (type: PropertyEditorTypes) => {
            if (type === PropertyEditorTypes.Reference) {
                if (!isReference(value))
                    onModifyProperty(propertyName, valueIndex, { "@id": value })
            } else {
                if (isReference(value)) onModifyProperty(propertyName, valueIndex, value["@id"])
            }
        },
        [onModifyProperty, propertyName, value, valueIndex]
    )

    if (propertyName === "@type")
        return (
            <TypeField value={value as string} onChange={onChange} onRemoveEntry={onRemoveEntry} />
        )

    if (propertyName === "@id") return <IDField value={value as string} />

    if (isReference(value))
        return (
            <ReferenceField
                entityId={entityId}
                value={value}
                onChange={onChange}
                onChangeType={onChangeType}
                propertyName={propertyName}
                valueIdx={valueIndex}
                propertyRange={propertyRange}
                onRemoveEntry={onRemoveEntry}
            />
        )

    if (
        typeof (value as unknown) === "number" ||
        typeof (value as unknown) === "string" ||
        typeof (value as unknown) === "bigint" ||
        typeof (value as unknown) === "boolean"
    )
        return (
            <TextBaseField
                value={value}
                onChange={onChange}
                onChangeType={onChangeType}
                propertyRange={propertyRange}
                onRemoveEntry={onRemoveEntry}
            />
        )

    return (
        <Error title="Unknown entry type" error="Please try to fix the issue in the JSON Editor" />
    )
})
