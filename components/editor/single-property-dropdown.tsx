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
import { SlimClass } from "@/lib/crate-verify/helpers"
import { PropertyEditorTypes } from "@/components/editor/property-editor"

export const SinglePropertyDropdown = memo(function SinglePropertyDropdown({
    propertyRange,
    isReference,
    onModifyTextLikeProperty,
    onModifyReferenceProperty,
    onChangeType,
    onRemoveEntry
}: {
    propertyRange?: SlimClass[]
    isReference?: boolean
    onModifyTextLikeProperty?: (value: string) => void
    onModifyReferenceProperty?: (value: IReference) => void
    onChangeType: (type: PropertyEditorTypes) => void
    onRemoveEntry: () => void
}) {
    const canClear = useMemo(() => {
        return onModifyReferenceProperty || onModifyTextLikeProperty
    }, [onModifyReferenceProperty, onModifyTextLikeProperty])

    const onClear = useCallback(() => {
        if (onModifyTextLikeProperty) {
            onModifyTextLikeProperty("")
        } else if (onModifyReferenceProperty) {
            onModifyReferenceProperty({ "@id": "" })
        }
    }, [onModifyReferenceProperty, onModifyTextLikeProperty])

    const propertyCanBe = usePropertyCanBe(propertyRange)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-l-0 rounded-l-none px-2">
                    <EllipsisVertical className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {canClear ? (
                    <DropdownMenuItem onClick={() => onClear()}>
                        {isReference ? (
                            <>
                                <Unlink className="w-4 h-4 mr-2" /> Unlink
                            </>
                        ) : (
                            <>
                                <Eraser className="w-4 h-4 mr-2" /> Clear
                            </>
                        )}
                    </DropdownMenuItem>
                ) : null}

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <ArrowLeftRight className="w-4 h-4 mr-2" /> Change Type
                    </DropdownMenuSubTrigger>
                    <TypeSelectDropdown
                        sub
                        propertyCanBe={propertyCanBe}
                        onPropertyTypeSelect={onChangeType}
                    />
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="bg-destructive" onClick={() => onRemoveEntry()}>
                    <Trash className="w-4 h-4 mr-2" /> Delete Entry
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
})
