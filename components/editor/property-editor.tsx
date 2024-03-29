import { EntityEditorProperty } from "@/components/editor/entity-editor"
import { isReference } from "@/lib/utils"
import { getPropertyComment } from "@/lib/schema-helpers"
import { ChangeEvent, useCallback } from "react"
import { ReferenceField } from "@/components/editor/reference-field"
import { TextField } from "@/components/editor/text-field"
import { TypeField } from "@/components/editor/type-field"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { IDField } from "@/components/editor/id-field"

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

    if (property.propertyName === "@type")
        return <TypeField value={value as string} onChange={() => {}} />

    if (property.propertyName === "@id")
        return <IDField value={value as string} onChange={() => {}} />

    if (isReference(value))
        return (
            <ReferenceField
                value={value}
                onChange={onReferenceChange}
                propertyName={property.propertyName}
            />
        )

    return <TextField value={value} onChange={onTextChange} />
}

export function PropertyEditor(props: PropertyEditorProps) {
    return (
        <div className="grid grid-cols-[12px_1fr_1fr] w-full">
            <div
                className={`${props.isNew ? "bg-success" : props.hasChanges ? "bg-info" : ""} max-w-1 rounded-full transition`}
            ></div>

            <div className="pr-8">
                <div>{props.property.propertyName}</div>
                <div className="text-muted-foreground text-sm">
                    {getPropertyComment("schema:" + props.property.propertyName) + ""}
                </div>
            </div>

            <div>
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
                {props.property.propertyName !== "@id" ? (
                    <Button
                        variant="link"
                        className="flex text items-center text-muted-foreground p-1"
                    >
                        <Plus className="w-3 h-3 mr-1" />
                        <span className="text-xs">Add another entry</span>
                    </Button>
                ) : null}
            </div>
        </div>
    )
}
