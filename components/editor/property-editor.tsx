import { EntityEditorProperty } from "@/components/editor/entity-editor"
import { isReference } from "@/lib/utils"
import { ChangeEvent, useCallback, useContext, useMemo } from "react"
import { ReferenceField } from "@/components/editor/reference-field"
import { TextField } from "@/components/editor/text-field"
import { TypeField } from "@/components/editor/type-field"
import { IDField } from "@/components/editor/id-field"
import { useAsync } from "@/components/use-async"
import { CrateVerifyContext } from "@/components/crate-verify-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { TEST_CONTEXT } from "@/components/crate-data-provider"
import { Error } from "@/components/error"
import AddEntryDropdown from "@/components/editor/add-entry-dropdown"

export enum PropertyEditorTypes {
    Time,
    Boolean,
    DateTime,
    Number,
    Text,
    Date,
    Reference
}

function propertyNameReadable(propertyName: string) {
    if (propertyName === "@id") return "Identifier"
    if (propertyName === "@type") return "Type"
    const split = propertyName.replace(/([a-z0-9])([A-Z])/, "$1 $2")
    return split.charAt(0).toUpperCase() + split.slice(1)
}

export interface PropertyEditorProps {
    property: EntityEditorProperty
    onModifyProperty: (
        propertyName: string,
        value: FlatEntitySinglePropertyTypes,
        valueIdx: number
    ) => void
    onAddPropertyEntry: (propertyName: string, type: PropertyEditorTypes) => void
    isNew?: boolean
    hasChanges?: boolean
}

export interface SinglePropertyEditorProps extends Omit<PropertyEditorProps, "onAddPropertyEntry"> {
    valueIndex: number
    propertyRange?: string[]
}

function SinglePropertyEditor({
    property,
    onModifyProperty,
    valueIndex,
    propertyRange
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
                propertyRange={propertyRange}
            />
        )

    return <TextField value={value} onChange={onTextChange} propertyRange={propertyRange} />
}

export function PropertyEditor(props: PropertyEditorProps) {
    const {
        isReady: crateVerifyReady,
        getPropertyComment,
        getPropertyRange
    } = useContext(CrateVerifyContext)

    const readablePropertyName = useMemo(() => {
        return propertyNameReadable(props.property.propertyName)
    }, [props.property.propertyName])

    const onAddEntry = useCallback(
        (type: PropertyEditorTypes) => {
            props.onAddPropertyEntry(props.property.propertyName, type)
        },
        [props]
    )

    const referenceTypeRangeResolver = useCallback(
        async (propertyName: string) => {
            if (crateVerifyReady) {
                const resolved = TEST_CONTEXT.resolve(propertyName)
                if (!resolved) return []
                const data = await getPropertyRange(resolved)
                return data
                    .map((s) => TEST_CONTEXT.reverse(s))
                    .filter((s) => typeof s === "string") as string[]
            }
        },
        [crateVerifyReady, getPropertyRange]
    )

    const { data: propertyRange, error: propertyRangeError } = useAsync(
        crateVerifyReady ? props.property.propertyName : null,
        referenceTypeRangeResolver
    )

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
                <Error
                    className="mb-2"
                    text={propertyRangeError}
                    prefix="Error while determining type range: "
                />
                <div className="flex flex-col gap-4">
                    {props.property.values.map((v, i) => {
                        return (
                            <SinglePropertyEditor
                                key={i}
                                valueIndex={i}
                                property={props.property}
                                onModifyProperty={props.onModifyProperty}
                                propertyRange={propertyRange}
                            />
                        )
                    })}
                </div>
                <AddEntryDropdown
                    property={props.property}
                    propertyRange={propertyRange}
                    onAddEntry={onAddEntry}
                />
            </div>
        </div>
    )
}
