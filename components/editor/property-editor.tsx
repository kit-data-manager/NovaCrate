import { createRef, memo, useCallback, useContext, useEffect, useMemo } from "react"
import { useAsync } from "@/components/use-async"
import { CrateVerifyContext } from "@/components/crate-verify-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { TEST_CONTEXT } from "@/components/crate-data-provider"
import { Error } from "@/components/error"
import { AddEntryDropdown } from "@/components/editor/add-entry-dropdown"
import { SinglePropertyEditor } from "@/components/editor/single-property-editor"
import { propertyNameReadable } from "@/lib/utils"
import { EntityEditorTabsContext } from "@/components/entity-tabs-provider"
import { editorState } from "@/components/editor-state"

export interface EntityEditorProperty {
    propertyName: string
    values: FlatEntitySinglePropertyTypes[]
}

function sortByPropertyName(a: EntityEditorProperty, b: EntityEditorProperty) {
    if (a.propertyName === "name" && b.propertyName === "name") return 0
    if (a.propertyName === "name" && !b.propertyName.startsWith("@")) return -1
    if (b.propertyName === "name" && !a.propertyName.startsWith("@")) return 1
    if (a.propertyName === b.propertyName) return 0
    return a.propertyName > b.propertyName ? 1 : -1
}

export function mapEntityToProperties(data: IFlatEntity): EntityEditorProperty[] {
    return Object.keys(data)
        .map((key) => {
            let value = data[key]
            let arrValue: FlatEntitySinglePropertyTypes[]
            if (!Array.isArray(value)) {
                arrValue = [value]
            } else {
                arrValue = value.slice()
            }

            return {
                propertyName: key,
                values: arrValue
            }
        })
        .flat()
        .sort(sortByPropertyName)
}

export function mapPropertiesToEntity(data: EntityEditorProperty[]): IFlatEntity {
    const result: Record<string, FlatEntityPropertyTypes> = {}

    function autoUnpack(value: FlatEntitySinglePropertyTypes[]) {
        if (value.length === 1) return value[0]
        else return value
    }

    for (const property of data) {
        if (property.values.length === 0) continue
        result[property.propertyName] = autoUnpack(property.values)
    }

    if (!("@id" in result)) throw "Mapping properties to entity failed, no @id property"
    if (!("@type" in result)) throw "Mapping properties to entity failed, no @id property"

    return result as IFlatEntity
}

export enum PropertyEditorTypes {
    Time,
    Boolean,
    DateTime,
    Number,
    Text,
    Date,
    Reference
}

export interface PropertyEditorProps {
    entityId: string
    property: EntityEditorProperty
    onModifyPropertyEntry: (
        propertyName: string,
        valueIdx: number,
        value: FlatEntitySinglePropertyTypes
    ) => void
    onAddPropertyEntry: (propertyName: string, type: PropertyEditorTypes) => void
    onRemovePropertyEntry: (propertyName: string, index: number) => void
    isNew?: boolean
    hasChanges?: boolean
}

export const PropertyEditor = memo(function PropertyEditor({
    entityId,
    property,
    onModifyPropertyEntry,
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
    const { focusedProperty, unFocusProperty } = useContext(EntityEditorTabsContext)
    const container = createRef<HTMLDivElement>()

    const isFocused = useMemo(() => {
        return focusedProperty === property.propertyName
    }, [focusedProperty, property.propertyName])

    useEffect(() => {
        if (isFocused && container.current) {
            container.current.scrollIntoView({ behavior: "smooth", block: "center" })

            const timer = setTimeout(() => {
                unFocusProperty()
            }, 2000)

            return () => clearTimeout(timer)
        }
    }, [container, isFocused, unFocusProperty])

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
        <div
            className={`grid grid-cols-[12px_1fr_1fr] w-full transition-colors ${isFocused ? "bg-secondary" : ""} py-3 px-1 rounded-lg`}
            ref={container}
        >
            <div
                className={`${isNew ? "bg-success" : hasChanges ? "bg-info" : ""} max-w-1 rounded-full transition`}
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
                                entityId={entityId}
                                valueIndex={i}
                                propertyName={property.propertyName}
                                value={v}
                                onModifyProperty={onModifyPropertyEntry}
                                propertyRange={propertyRange}
                                onRemovePropertyEntry={onRemovePropertyEntry}
                            />
                        )
                    })}
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
