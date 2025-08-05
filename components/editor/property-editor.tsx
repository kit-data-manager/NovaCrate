import React, {
    createRef,
    memo,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react"
import { SchemaWorker } from "@/components/providers/schema-worker-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { Error } from "@/components/error"
import { AddEntryDropdown } from "@/components/editor/add-entry-dropdown"
import { SinglePropertyEditor } from "@/components/editor/single-property-editor"
import { camelCaseReadable } from "@/lib/utils"
import { useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"
import { useEditorState } from "@/lib/state/editor-state"
import { Trash, TriangleAlert } from "lucide-react"
import { MarkdownComment } from "@/components/markdown-comment"
import { Pagination } from "@/components/pagination"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import useSWR from "swr"
import { SinglePropertyValidation } from "@/components/editor/single-property-validation"
import { EntityEditorProperty, PropertyType } from "@/lib/property"
import { useValidation } from "@/lib/validation/hooks"

export interface PropertyEditorProps {
    entityId: string
    property: EntityEditorProperty
    onModifyPropertyEntry: (
        propertyName: string,
        valueIdx: number,
        value: EntitySinglePropertyTypes
    ) => void
    onAddPropertyEntry: (propertyName: string, type: PropertyType) => void
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
    const { isReady: crateVerifyReady, worker } = useContext(SchemaWorker)
    const focusedProperty = useEntityEditorTabs((store) => store.focusedProperty)
    const unFocusProperty = useEntityEditorTabs((store) => store.unFocusProperty)
    const crateContext = useEditorState((store) => store.crateContext)
    const container = createRef<HTMLDivElement>()
    const validation = useValidation()
    const [validationRunning, setValidationRunning] = useState(false)

    const runValidation = useCallback(() => {
        setValidationRunning(true)
        validation.validateProperty(entityId, property.propertyName).then(() => {
            setValidationRunning(false)
        })
    }, [entityId, property.propertyName, validation])

    useEffect(() => {
        runValidation()
    }, [runValidation])

    useEffect(() => {
        console.log("Values changed!")
        runValidation()
    }, [property.values, runValidation])

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
        (type: PropertyType) => {
            onAddPropertyEntry(property.propertyName, type)
        },
        [onAddPropertyEntry, property.propertyName]
    )

    const resolvedPropertyName = useMemo(() => {
        if (property.propertyName === "@id" || property.propertyName === "@type")
            return property.propertyName
        return crateContext.resolve(property.propertyName)
    }, [crateContext, property.propertyName])

    const referenceTypeRangeResolver = useCallback(async () => {
        if (property.propertyName.startsWith("@")) return []
        if (crateVerifyReady) {
            if (!resolvedPropertyName)
                throw `Property ${property.propertyName} not defined in context`
            return await worker.execute("getPropertyRange", resolvedPropertyName)
        }
    }, [crateVerifyReady, property.propertyName, resolvedPropertyName, worker])

    const { data: propertyRange, error: propertyRangeError } = useSWR(
        crateVerifyReady ? "property-type-range-" + property.propertyName : null,
        referenceTypeRangeResolver
    )

    const propertyCommentResolver = useCallback(async () => {
        if (property.propertyName === "@id") return "The unique identifier of the entity"
        if (property.propertyName === "@type")
            return "The type defines which properties can occur on the entity"
        if (!resolvedPropertyName) throw `Property ${property.propertyName} not defined in context`
        const comment = await worker.execute("getPropertyComment", resolvedPropertyName)
        if (!comment) throw `Could not find comment for property ${resolvedPropertyName}`
        return comment
    }, [property.propertyName, resolvedPropertyName, worker])

    const {
        data: comment,
        error: commentError,
        isLoading: commentIsPending
    } = useSWR(
        crateVerifyReady ? "property-comment-" + property.propertyName : null,
        propertyCommentResolver
    )

    const [expandComment, setExpandComment] = useState(false)

    const toggleExpandComment = useCallback(() => {
        setExpandComment((v) => !v)
    }, [])

    const Comment = useCallback(() => {
        if (commentIsPending) {
            return <Skeleton className="h-3 w-4/12 mt-1" />
        } else if (resolvedPropertyName === null) {
            console.warn(
                "Error encountered while resolving comment for property " + property.propertyName,
                commentError
            )
            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="text-warn inline-flex items-center gap-2">
                            <TriangleAlert className="size-4" /> Unresolved property (not in
                            context)
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        This property ({property.propertyName}) is not defined in the crate context.
                        Comment and type can not be determined.
                    </TooltipContent>
                </Tooltip>
            )
        } else if (commentError) {
            console.warn(
                "Error encountered while resolving comment for property " + property.propertyName,
                commentError
            )
            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="text-warn inline-flex items-center gap-2">
                            <TriangleAlert className="size-4" /> Unresolved property (no matching
                            schema)
                        </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xl">
                        This property ({resolvedPropertyName ?? property.propertyName}) could not be
                        found in one of the registered schemas. Comment and type can not be
                        determined. Please add the required schema in the settings.
                        <Error
                            error={commentError}
                            className="mt-2"
                            title="Error while resolving property comment"
                        />
                    </TooltipContent>
                </Tooltip>
            )
        } else if (comment !== undefined) {
            return (
                <span className={expandComment ? "" : "line-clamp-3"} onClick={toggleExpandComment}>
                    <MarkdownComment comment={comment} allowLinks />
                </span>
            )
        } else return null
    }, [
        comment,
        commentError,
        commentIsPending,
        expandComment,
        property.propertyName,
        resolvedPropertyName,
        toggleExpandComment
    ])

    return (
        <div
            className={`grid grid-cols-[12px_4fr_5fr] w-full transition-colors ${isFocused ? "bg-secondary" : ""} py-3 px-1 rounded-lg`}
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
                {!!propertyRangeError && !commentError && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="text-warn inline-flex items-center gap-2 text-sm">
                                <TriangleAlert className="size-4" /> Error encountered while
                                resolving property type
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <Error
                                className="mb-2"
                                error={propertyRangeError}
                                title="Error while determining type range"
                            />
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>

            <div className="truncate p-1">
                {isDeleted ? (
                    <div className="flex items-center text-muted-foreground mb-4">
                        <Trash className="size-4 mr-2" /> This empty property will be deleted on
                        save
                    </div>
                ) : null}

                <div className="flex flex-col gap-4">
                    <Pagination
                        leftContent={
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
                                <div key={i} className="flex items-center">
                                    <SinglePropertyEditor
                                        entityId={entityId}
                                        valueIndex={i}
                                        propertyName={property.propertyName}
                                        value={v}
                                        onModifyProperty={onModifyPropertyEntry}
                                        propertyRange={propertyRange}
                                        onRemovePropertyEntry={onRemovePropertyEntry}
                                    />
                                    <SinglePropertyValidation
                                        entityId={entityId}
                                        propertyName={property.propertyName}
                                        propertyIndex={i}
                                        validationRunning={validationRunning}
                                    />
                                </div>
                            )
                        })}
                    </Pagination>
                </div>
            </div>
        </div>
    )
})
