import { memo, useCallback } from "react"
import { TypeField } from "@/components/editor/type-field"
import { IDField } from "@/components/editor/id-field"
import { isReference } from "@/lib/utils"
import { ReferenceField } from "@/components/editor/reference-field"
import { TextField } from "@/components/editor/text-field"
import { PropertyEditorProps } from "@/components/editor/property-editor"
import { SlimClass } from "@/lib/crate-verify/helpers"

export interface SinglePropertyEditorProps {
    entityId: string
    propertyName: string
    value: FlatEntitySinglePropertyTypes
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
    const onReferenceChange = useCallback(
        (newValue: IReference) => {
            onModifyProperty(propertyName, valueIndex, newValue)
        },
        [onModifyProperty, propertyName, valueIndex]
    )

    const onTextChange = useCallback(
        (newValue: string) => {
            onModifyProperty(propertyName, valueIndex, newValue)
        },
        [onModifyProperty, propertyName, valueIndex]
    )

    const onRemoveEntry = useCallback(() => {
        onRemovePropertyEntry(propertyName, valueIndex)
    }, [onRemovePropertyEntry, propertyName, valueIndex])

    if (propertyName === "@type") return <TypeField value={value as string} onChange={() => {}} />

    if (propertyName === "@id") return <IDField value={value as string} onChange={() => {}} />

    if (isReference(value))
        return (
            <ReferenceField
                entityId={entityId}
                value={value}
                onChange={onReferenceChange}
                propertyName={propertyName}
                valueIdx={valueIndex}
                propertyRange={propertyRange}
                onRemoveEntry={onRemoveEntry}
            />
        )

    return (
        <TextField
            value={value}
            onChange={onTextChange}
            propertyRange={propertyRange}
            onRemoveEntry={onRemoveEntry}
        />
    )
})
