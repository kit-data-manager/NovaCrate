import { Dialog, DialogContent } from "@/components/ui/dialog"
import { SchemaNode } from "@/lib/schema-worker/SchemaGraph"
import { useCallback, useEffect, useState } from "react"
import {
    getPropertyTypeDefaultValue,
    PropertyEditorTypes
} from "@/components/editor/property-editor"
import { SelectProperty } from "@/components/modals/add-property/select-property"
import { usePropertyCanBe } from "@/components/editor/property-hooks"
import { SelectType } from "@/components/modals/add-property/select-type"

export interface PossibleProperty {
    propertyName: string
    range: string[]
    rangeReadable: string[]
    comment: SchemaNode["comment"]
}

export function AddPropertyModal({
    open,
    onPropertyAdd,
    onOpenChange,
    typeArray
}: {
    open: boolean
    onPropertyAdd: (propertyName: string, values: FlatEntitySinglePropertyTypes) => void
    onOpenChange: (open: boolean) => void
    typeArray: string[]
}) {
    const [typeSelectOptions, setTypeSelectOptions] = useState<
        ReturnType<typeof usePropertyCanBe> | undefined
    >(undefined)
    const [selectedPropertyName, setSelectedPropertyName] = useState("")

    const onPropertySelect = useCallback(
        (propertyName: string, canBe: ReturnType<typeof usePropertyCanBe>) => {
            if (canBe.possiblePropertyTypes.length === 1) {
                onPropertyAdd(
                    propertyName,
                    getPropertyTypeDefaultValue(canBe.possiblePropertyTypes[0])
                )
                onOpenChange(false)
            } else if (canBe.possiblePropertyTypes.length === 0) {
                console.warn("Got empty canBe from " + propertyName)
                onPropertyAdd(propertyName, getPropertyTypeDefaultValue(PropertyEditorTypes.Text))
                onOpenChange(false)
            } else {
                setTypeSelectOptions(canBe)
                setSelectedPropertyName(propertyName)
            }
        },
        [onOpenChange, onPropertyAdd]
    )

    const onTypeSelect = useCallback(
        (type: PropertyEditorTypes) => {
            onPropertyAdd(selectedPropertyName, getPropertyTypeDefaultValue(type))
            onOpenChange(false)
        },
        [onOpenChange, onPropertyAdd, selectedPropertyName]
    )

    const backToPropertySelect = useCallback(() => {
        setTypeSelectOptions(undefined)
        setSelectedPropertyName("")
    }, [])

    useEffect(() => {
        if (!open)
            setTimeout(() => {
                // This just resets the modal
                backToPropertySelect()
            }, 200)
    }, [backToPropertySelect, open])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                {!typeSelectOptions ? (
                    <SelectProperty
                        open={open}
                        onPropertySelect={onPropertySelect}
                        typeArray={typeArray}
                    />
                ) : (
                    <SelectType
                        onTypeSelect={onTypeSelect}
                        possibleTypes={typeSelectOptions}
                        onBackClick={backToPropertySelect}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}
