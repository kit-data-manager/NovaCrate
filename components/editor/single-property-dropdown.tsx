import { memo, useCallback, useMemo } from "react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ArrowLeftRight, EllipsisVertical, Eraser, Trash, Unlink } from "lucide-react"
import TypeSelectDropdown from "@/components/editor/type-select-dropdown"
import { usePropertyCanBe } from "@/components/editor/property-hooks"
import { SlimClass } from "@/lib/schema-worker/helpers"
import { cn } from "@/lib/utils"
import { getPropertyTypeDefaultValue, PropertyType } from "@/lib/property"

export const SinglePropertyDropdown = memo(function SinglePropertyDropdown({
    propertyRange,
    isReference,
    onModifyTextLikeProperty,
    onModifyReferenceProperty,
    onChangeType,
    onRemoveEntry,
    triggerClassName,
    propertyType
}: {
    propertyRange?: SlimClass[]
    isReference?: boolean
    onModifyTextLikeProperty?: (value: string) => void
    onModifyReferenceProperty?: (value: IReference) => void
    onChangeType: (type: PropertyType) => void
    onRemoveEntry: () => void
    triggerClassName?: string
    propertyType: PropertyType
}) {
    const canClear = useMemo(() => {
        return onModifyReferenceProperty || onModifyTextLikeProperty
    }, [onModifyReferenceProperty, onModifyTextLikeProperty])

    const onClear = useCallback(() => {
        if (onModifyTextLikeProperty) {
            onModifyTextLikeProperty(getPropertyTypeDefaultValue(propertyType) as string)
        } else if (onModifyReferenceProperty) {
            onModifyReferenceProperty({ "@id": "" })
        }
    }, [onModifyReferenceProperty, onModifyTextLikeProperty, propertyType])

    const propertyCanBe = usePropertyCanBe(propertyRange)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    id={"single-property-dropdown-trigger"}
                    className={cn("border-l-0 rounded-l-none px-2", triggerClassName)}
                >
                    <EllipsisVertical className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {canClear ? (
                    <DropdownMenuItem onClick={() => onClear()}>
                        {isReference ? (
                            <>
                                <Unlink className="size-4 mr-2" /> Unlink
                            </>
                        ) : (
                            <>
                                <Eraser className="size-4 mr-2" /> Clear
                            </>
                        )}
                    </DropdownMenuItem>
                ) : null}

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <ArrowLeftRight className="size-4 mr-2" /> Change Type
                    </DropdownMenuSubTrigger>
                    <TypeSelectDropdown
                        sub
                        propertyCanBe={propertyCanBe}
                        onPropertyTypeSelect={onChangeType}
                    />
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem variant="destructive" onClick={() => onRemoveEntry()}>
                    <Trash className="size-4 mr-2" /> Remove Entry
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
})
