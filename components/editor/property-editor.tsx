import { EntityEditorProperty } from "@/components/editor/entity-editor"
import { isReference } from "@/lib/utils"
import { ChangeEvent, useCallback, useContext, useMemo } from "react"
import { ReferenceField } from "@/components/editor/reference-field"
import { TextField } from "@/components/editor/text-field"
import { TypeField } from "@/components/editor/type-field"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { IDField } from "@/components/editor/id-field"
import { useAsync } from "@/components/use-async"
import { CrateVerifyContext } from "@/components/crate-verify-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { TEST_CONTEXT } from "@/components/crate-data-provider"

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

function entryName(property: EntityEditorProperty) {
    if (property.propertyName === "@type") {
        return "type"
    } else return "entry"
}

function propertyNameReadable(propertyName: string) {
    if (propertyName === "@id") return "Identifier"
    if (propertyName === "@type") return "Type"
    const split = propertyName.replace(/([a-z0-9])([A-Z])/, "$1 $2")
    return split.charAt(0).toUpperCase() + split.slice(1)
}

function SinglePropertyEditor({
    property,
    onModifyProperty,
    valueIndex
}: SinglePropertyEditorProps) {
    const value = property.values[valueIndex]

    const onReferenceChange = useCallback((value: IReference) => {}, []) // TODO

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
    const { isReady: crateVerifyReady, getPropertyComment } = useContext(CrateVerifyContext)

    const readablePropertyName = useMemo(() => {
        return propertyNameReadable(props.property.propertyName)
    }, [props.property.propertyName])

    const propertyCommentResolver = useCallback(
        async (propertyId: string) => {
            if (propertyId === "@id") return "The unique identifier of the entity"
            if (propertyId === "@type")
                return "The type defines which properties can occur on the entity"
            const resolved = TEST_CONTEXT.resolve(propertyId)
            return await getPropertyComment(resolved || "unresolved")
        },
        [getPropertyComment]
    )

    const {
        data: comment,
        error: commentError,
        isPending: commentIsPending
    } = useAsync(crateVerifyReady ? props.property.propertyName : null, propertyCommentResolver)

    const Comment = useCallback(() => {
        if (commentIsPending) {
            return <Skeleton className="h-3 w-4/12 mt-1" />
        } else if (commentError) {
            return <span className="text-destructive">{commentError}</span>
        } else if (comment !== undefined) {
            return <span>{comment + ""}</span>
        } else return null
    }, [comment, commentError, commentIsPending])

    return (
        <div className="grid grid-cols-[12px_1fr_1fr] w-full">
            <div
                className={`${props.isNew ? "bg-success" : props.hasChanges ? "bg-info" : ""} max-w-1 rounded-full transition`}
            ></div>

            <div className="pr-8">
                <div>{readablePropertyName}</div>
                <div
                    className={`${commentIsPending ? "text-background" : "text-muted-foreground"} text-sm transition`}
                >
                    <Comment />
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
                        <span className="text-xs">Add another {entryName(props.property)}</span>
                    </Button>
                ) : null}
            </div>
        </div>
    )
}
