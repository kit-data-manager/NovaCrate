import { EntityEditorProperty } from "@/components/editor/entity-editor"
import { memo, useCallback, useContext, useMemo } from "react"
import { useAsync } from "@/components/use-async"
import { CrateVerifyContext } from "@/components/crate-verify-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { TEST_CONTEXT } from "@/components/crate-data-provider"
import { Error } from "@/components/error"
import { AddEntryDropdown } from "@/components/editor/add-entry-dropdown"
import { SinglePropertyEditor } from "@/components/editor/single-property-editor"
import { Trash } from "lucide-react"

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
    onRemovePropertyEntry: (propertyName: string, index: number) => void
    isNew?: boolean
    hasChanges?: boolean
}

export const PropertyEditor = memo(function PropertyEditor({
    property,
    onModifyProperty,
    onAddPropertyEntry,
    isNew,
    hasChanges,
    onRemovePropertyEntry
}: PropertyEditorProps) {
    const {
        isReady: crateVerifyReady,
        getPropertyComment,
        getPropertyRange
    } = useContext(CrateVerifyContext)

    const readablePropertyName = useMemo(() => {
        return propertyNameReadable(property.propertyName)
    }, [property.propertyName])

    const onAddEntry = useCallback(
        (type: PropertyEditorTypes) => {
            onAddPropertyEntry(property.propertyName, type)
        },
        [onAddPropertyEntry, property.propertyName]
    )

    const referenceTypeRangeResolver = useCallback(
        async (propertyName: string) => {
            if (crateVerifyReady) {
                const resolved = TEST_CONTEXT.resolve(propertyName)
                if (!resolved) return []
                return await getPropertyRange(resolved)
            }
        },
        [crateVerifyReady, getPropertyRange]
    )

    const { data: propertyRange, error: propertyRangeError } = useAsync(
        crateVerifyReady ? property.propertyName : null,
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
    } = useAsync(crateVerifyReady ? property.propertyName : null, propertyCommentResolver)

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
                className={`${property.values.length === 0 ? "bg-destructive" : isNew ? "bg-success" : hasChanges ? "bg-info" : ""} max-w-1 rounded-full transition`}
            ></div>

            <div className="pr-8">
                <div>{readablePropertyName}</div>
                <div
                    className={`${commentIsPending ? "text-background" : "text-muted-foreground"} text-sm transition`}
                >
                    <Comment />
                </div>
            </div>

            <div className="truncate p-1">
                <Error
                    className="mb-2"
                    text={propertyRangeError}
                    prefix="Error while determining type range: "
                />
                <div className="flex flex-col gap-4">
                    {property.values.map((v, i) => {
                        return (
                            <SinglePropertyEditor
                                key={i}
                                valueIndex={i}
                                propertyName={property.propertyName}
                                value={v}
                                onModifyProperty={onModifyProperty}
                                propertyRange={propertyRange}
                                onRemovePropertyEntry={onRemovePropertyEntry}
                            />
                        )
                    })}
                    {property.values.length === 0 ? (
                        <div className="flex items-center text-sm text-muted-foreground">
                            <Trash className="w-4 h-4 mr-2" /> This Property has no entries and will
                            be deleted on save
                        </div>
                    ) : null}
                </div>
                <AddEntryDropdown
                    propertyName={property.propertyName}
                    propertyRange={propertyRange}
                    onAddEntry={onAddEntry}
                    another={property.values.length > 0}
                />
            </div>
        </div>
    )
})
