import React, {
    createRef,
    memo,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react"
import { CrateVerifyContext } from "@/components/providers/crate-verify-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { Error } from "@/components/error"
import { AddEntryDropdown } from "@/components/editor/add-entry-dropdown"
import { SinglePropertyEditor } from "@/components/editor/single-property-editor"
import { camelCaseReadable } from "@/lib/utils"
import { EntityEditorTabsContext } from "@/components/providers/entity-tabs-provider"
import { useEditorState } from "@/lib/state/editor-state"
import { handleSpringError } from "@/lib/spring-error-handling"
import { useAsync } from "@/lib/hooks"
import { Trash } from "lucide-react"
import { MarkdownComment } from "@/components/markdown-comment"
import { getDefaultDate } from "@/components/editor/text-fields/date-field"
import { PropertyPagination } from "@/components/editor/property-pagination"

export interface EntityEditorProperty {
    propertyName: string
    values: FlatEntitySinglePropertyTypes[]
    deleted: boolean
}

function sortByPropertyName(a: EntityEditorProperty, b: EntityEditorProperty) {
    if (a.propertyName === "name" && b.propertyName === "name") return 0
    if (a.propertyName === "name" && !b.propertyName.startsWith("@")) return -1
    if (b.propertyName === "name" && !a.propertyName.startsWith("@")) return 1
    if (a.propertyName === b.propertyName) return 0
    return a.propertyName > b.propertyName ? 1 : -1
}

// TODO maybe get rid of this, causes problems with re-rendering
export function mapEntityToProperties(
    data: IFlatEntity,
    initialData?: IFlatEntity
): EntityEditorProperty[] {
    const deletedProperties: EntityEditorProperty[] = Object.keys(initialData || {})
        .filter((key) => !(key in data))
        .map((key) => ({ propertyName: key, values: [], deleted: true }))

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
                values: arrValue,
                deleted: false
            }
        })
        .flat()
        .concat(deletedProperties)
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

export function getPropertyTypeDefaultValue(
    type: PropertyEditorTypes
): FlatEntitySinglePropertyTypes {
    if (type === PropertyEditorTypes.Text) return ""
    if (type === PropertyEditorTypes.Reference) return { "@id": "" }
    if (type === PropertyEditorTypes.Date) return getDefaultDate()
    if (type === PropertyEditorTypes.Number) return "0"
    if (type === PropertyEditorTypes.Boolean) return "true"
    if (type === PropertyEditorTypes.DateTime) return getDefaultDate() + "T08:00"
    if (type === PropertyEditorTypes.Time) return "08:00"
    return ""
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
    isDeleted?: boolean
}

export const PropertyEditor = memo(function PropertyEditor({
    entityId,
    property,
    onModifyPropertyEntry,
    onAddPropertyEntry,
    isNew,
    hasChanges,
    isDeleted,
    onRemovePropertyEntry
}: PropertyEditorProps) {
    const { isReady: crateVerifyReady, worker } = useContext(CrateVerifyContext)
    const { focusedProperty, unFocusProperty } = useContext(EntityEditorTabsContext)
    const crateContext = useEditorState.useCrateContext()
    const container = createRef<HTMLDivElement>()

    const isFocused = useMemo(() => {
        return focusedProperty === property.propertyName
    }, [focusedProperty, property.propertyName])

    useEffect(() => {
        if (isFocused && container.current) {
            container.current.scrollIntoView({ behavior: "smooth", block: "center" })

            const timer = setTimeout(() => {
                unFocusProperty()
            }, 1000)

            return () => clearTimeout(timer)
        }
    }, [container, isFocused, unFocusProperty])

    const readablePropertyName = useMemo(() => {
        return camelCaseReadable(property.propertyName)
    }, [property.propertyName])

    const onAddEntry = useCallback(
        (type: PropertyEditorTypes) => {
            onAddPropertyEntry(property.propertyName, type)
        },
        [onAddPropertyEntry, property.propertyName]
    )

    const referenceTypeRangeResolver = useCallback(
        async (propertyName: string) => {
            if (propertyName.startsWith("@")) return []
            if (crateVerifyReady) {
                const resolved = crateContext.resolve(propertyName)
                if (!resolved) throw "Property not defined in context"
                return await worker.execute("getPropertyRange", resolved)
            }
        },
        [crateContext, crateVerifyReady, worker]
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
            const resolved = crateContext.resolve(propertyId)
            if (!resolved) throw "Property not defined in context"
            const comment = await worker.execute("getPropertyComment", resolved)
            if (!comment) throw "Could not find comment"
            return comment
        },
        [crateContext, worker]
    )

    const {
        data: comment,
        error: commentError,
        isPending: commentIsPending
    } = useAsync(crateVerifyReady ? property.propertyName : null, propertyCommentResolver)

    const [expandComment, setExpandComment] = useState(false)

    const toggleExpandComment = useCallback(() => {
        setExpandComment((v) => !v)
    }, [])

    const Comment = useCallback(() => {
        if (commentIsPending) {
            return <Skeleton className="h-3 w-4/12 mt-1" />
        } else if (commentError) {
            return <span className="text-destructive">{handleSpringError(commentError)}</span>
        } else if (comment !== undefined) {
            return (
                <span className={expandComment ? "" : "line-clamp-3"} onClick={toggleExpandComment}>
                    <MarkdownComment comment={comment} allowLinks />
                </span>
            )
        } else return null
    }, [comment, commentError, commentIsPending, expandComment, toggleExpandComment])

    return (
        <div
            className={`grid grid-cols-[12px_1fr_1fr] w-full transition-colors ${isFocused ? "bg-secondary" : ""} py-3 px-1 rounded-lg`}
            ref={container}
        >
            <div
                className={`${isDeleted ? "bg-destructive" : isNew ? "bg-success" : hasChanges ? "bg-info" : ""} max-w-1 rounded-full transition`}
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
                    error={propertyRangeError}
                    title="Error while determining type range"
                />
                {isDeleted ? (
                    <div className="flex items-center text-muted-foreground">
                        <Trash className="w-4 h-4 mr-2" /> Empty Property will be deleted on save
                    </div>
                ) : null}
                <div className="flex flex-col gap-4">
                    <PropertyPagination
                        addEntryDropdown={
                            <AddEntryDropdown
                                propertyName={property.propertyName}
                                propertyRange={propertyRange}
                                onAddEntry={onAddEntry}
                                another={property.values.length > 0}
                            />
                        }
                    >
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
                    </PropertyPagination>
                </div>
            </div>
        </div>
    )
})
