import { EntityEditorProperty } from "@/components/editor/entity-editor"
import { isReference } from "@/lib/utils"
import { getPropertyComment } from "@/lib/schema-helpers"
import { ChangeEvent, useCallback } from "react"
import { ReferenceField } from "@/components/editor/reference-field"
import { TextField } from "@/components/editor/text-field"

export interface PropertyEditorProps {
    property: EntityEditorProperty
    onModifyProperty: (
        propertyName: string,
        value: FlatEntitySinglePropertyTypes,
        valueIdx: number
    ) => void
    isNew?: boolean
    hasChanges?: boolean
}

export interface SinglePropertyEditorProps extends PropertyEditorProps {
    valueIndex: number
}

function SinglePropertyEditor({
    property,
    onModifyProperty,
    valueIndex
}: SinglePropertyEditorProps) {
    const value = property.values[valueIndex]

    const onReferenceChange = useCallback((value: Reference) => {}, []) // TODO

    const onTextChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            onModifyProperty(property.propertyName, e.target.value, valueIndex)
        },
        [onModifyProperty, property.propertyName, valueIndex]
    )

    return isReference(value) ? (
        <ReferenceField
            value={value}
            onChange={onReferenceChange}
            propertyName={property.propertyName}
        />
    ) : (
        <TextField value={value} onChange={onTextChange} />
    )
}

export function PropertyEditor(props: PropertyEditorProps) {
    return (
        <div className="grid grid-cols-[12px_1fr_1fr] w-full">
            <div
                className={`${props.isNew ? "bg-success" : props.hasChanges ? "bg-info" : ""} max-w-1 rounded-full transition`}
            ></div>

            <div className="pr-4">
                <div>{props.property.propertyName}</div>
                <div className="text-muted-foreground text-sm">
                    {getPropertyComment("schema:" + props.property.propertyName) + ""}
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {props.property.values.map((v, i) => {
                    return (
                        <SinglePropertyEditor
                            key={i}
                            valueIndex={i}
                            property={props.property}
                            onModifyProperty={props.onModifyProperty}
                        />
                    )
                })}
            </div>
        </div>
    )
}
