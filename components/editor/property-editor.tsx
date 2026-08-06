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
import { useContextResolver } from "@/lib/hooks/hooks"
import { Trash, TriangleAlert } from "lucide-react"
import { MarkdownComment } from "@/components/markdown-comment"
import { Pagination } from "@/components/pagination"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import useSWR from "swr"
import { SinglePropertyValidation } from "@/components/editor/validation/single-property-validation"
import { EntityEditorProperty, PropertyType } from "@/lib/property"
import { useActivePropertyProfileRules } from "@/lib/hooks/property-can-be"
import { determinePropertyRuleRange } from "@/lib/core/profiles/impl/util/determine-property-rule-range"
import { useProfileService } from "@/lib/hooks/use-profile-service"
import { SlimClass } from "@/lib/schema-worker/helpers"
import { PropertyRule } from "@/lib/core/profiles/types/PropertyRule"

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

function makeProfilePropertyRulesCacheKey(profilePropertyRules: PropertyRule[]) {
    return profilePropertyRules.length > 0
        ? profilePropertyRules
              .map((r) => r["@id"])
              .sort()
              .join(";")
        : "no-profiles"
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
    const { isReady: schemaWorkerReady, worker } = useContext(SchemaWorker)
    const focusedProperty = useEntityEditorTabs((store) => store.focusedProperty)
    const unFocusProperty = useEntityEditorTabs((store) => store.unFocusProperty)
    const crateContextReady = useEditorState((store) => store.crateContextReady)
    const resolver = useContextResolver()
    const profilePropertyRules = useActivePropertyProfileRules(entityId, property.propertyName)
    const profileService = useProfileService()
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
        (type: PropertyType) => {
            onAddPropertyEntry(property.propertyName, type)
        },
        [onAddPropertyEntry, property.propertyName]
    )

    const resolvedPropertyName = useMemo(() => {
        if (!crateContextReady) return null
        if (property.propertyName === "@id" || property.propertyName === "@type")
            return property.propertyName
        return resolver.resolve(property.propertyName)
    }, [resolver, crateContextReady, property.propertyName])

    const resolvePropertyRuleTypeRange = useCallback(async (): Promise<SlimClass[]> => {
        const result: SlimClass[] = []
        for (const propertyRule of profilePropertyRules) {
            const handler = profileService.getProfileHandler(propertyRule.onHandler)
            if (!handler) continue
            const range = await determinePropertyRuleRange(handler, propertyRule, resolver, worker)
            result.push(
                ...range.rangeIncludesTypes.map(
                    (id) => ({ "@id": id, comment: "" }) satisfies SlimClass
                )
            )
        }
        return result
    }, [profilePropertyRules, profileService, resolver, worker])

    const referenceTypeRangeResolver = useCallback(async () => {
        if (property.propertyName.startsWith("@")) return []
        if (schemaWorkerReady) {
            if (!resolvedPropertyName)
                throw `Property ${property.propertyName} not defined in context`
            if (profilePropertyRules.length > 0) return resolvePropertyRuleTypeRange()
            return await worker.execute("getPropertyRange", resolvedPropertyName)
        }
    }, [
        property.propertyName,
        schemaWorkerReady,
        resolvedPropertyName,
        profilePropertyRules.length,
        resolvePropertyRuleTypeRange,
        worker
    ])

    const profileCacheKey = makeProfilePropertyRulesCacheKey(profilePropertyRules)

    const { data: propertyRange, error: propertyRangeError } = useSWR(
        schemaWorkerReady && crateContextReady
            ? "property-type-range-" + property.propertyName + "-" + profileCacheKey
            : null,
        referenceTypeRangeResolver
    )

    const propertyCommentResolver = useCallback(async () => {
        if (property.propertyName === "@id") return "The unique identifier of the entity"
        if (property.propertyName === "@type")
            return "The type defines which properties can occur on the entity"
        if (!resolvedPropertyName) throw `Property ${property.propertyName} not defined in context`
        if (profilePropertyRules.filter((r) => r.description).length > 0)
            return profilePropertyRules.map((r) => r.description).join("\n\n")
        const comment = await worker.execute("getPropertyComment", resolvedPropertyName)
        if (!comment) throw `Could not find comment for property ${resolvedPropertyName}`
        return comment
    }, [profilePropertyRules, property.propertyName, resolvedPropertyName, worker])

    const {
        data: comment,
        error: commentError,
        isLoading: commentIsPending
    } = useSWR(
        schemaWorkerReady && crateContextReady
            ? "property-comment-" + property.propertyName + "-" + profileCacheKey
            : null,
        propertyCommentResolver
    )

    const [expandComment, setExpandComment] = useState(false)

    const toggleExpandComment = useCallback(() => {
        setExpandComment((v) => !v)
    }, [])

    const commentElement = useMemo(() => {
        if (commentIsPending || !crateContextReady) {
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
        crateContextReady,
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
                    {commentElement}
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

                <div
                    className="flex flex-col gap-4"
                    id={`property-editor-${property.propertyName}-right`}
                >
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
                                <div
                                    key={i}
                                    id={`single-property-editor-${property.propertyName}-${i}`}
                                    className="flex items-center"
                                >
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
