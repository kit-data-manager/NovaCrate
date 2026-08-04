import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useCallback, useEffect, useState } from "react"
import { SelectProperty } from "@/components/modals/add-property/select-property"
import { usePropertyCanBe } from "@/lib/hooks/property-can-be"
import { SelectType } from "@/components/modals/add-property/select-type"
import { SchemaNode } from "@/lib/schema-worker/SchemaNode"
import { getPropertyTypeDefaultValue, PropertyType } from "@/lib/property"
import { getActiveProfileClassesForEntity } from "@/lib/core/profiles/impl/util/get-active-profile-classes-for-entity"
import { useProfileService } from "@/lib/hooks/use-profile-service"
import { toArray } from "@/lib/utils"

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
    entity,
    onlyReferences = false
}: {
    open: boolean
    onPropertyAdd: (propertyName: string, values: EntitySinglePropertyTypes) => void
    onOpenChange: (open: boolean) => void
    entity: IEntity
    onlyReferences?: boolean
}) {
    const [typeSelectOptions, setTypeSelectOptions] = useState<
        ReturnType<typeof usePropertyCanBe> | undefined
    >(undefined)
    const [selectedPropertyName, setSelectedPropertyName] = useState("")
    const profileService = useProfileService()

    const typeArray = open ? toArray(entity["@type"]) : []
    const profileClasses = open
        ? getActiveProfileClassesForEntity(entity["@id"], profileService)
        : []

    const onPropertySelect = useCallback(
        (propertyName: string, canBe: ReturnType<typeof usePropertyCanBe>) => {
            if (onlyReferences) {
                onPropertyAdd(propertyName, getPropertyTypeDefaultValue(PropertyType.Reference))
                onOpenChange(false)
            } else if (canBe.possiblePropertyTypes.length === 1) {
                onPropertyAdd(
                    propertyName,
                    getPropertyTypeDefaultValue(canBe.possiblePropertyTypes[0])
                )
                onOpenChange(false)
            } else if (canBe.possiblePropertyTypes.length === 0) {
                console.warn("Got empty canBe from " + propertyName)
                onPropertyAdd(propertyName, getPropertyTypeDefaultValue(PropertyType.Text))
                onOpenChange(false)
            } else {
                setTypeSelectOptions(canBe)
                setSelectedPropertyName(propertyName)
            }
        },
        [onOpenChange, onPropertyAdd, onlyReferences]
    )

    const onTypeSelect = useCallback(
        (type: PropertyType) => {
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
                        profileClasses={profileClasses}
                        onlyReferences={onlyReferences}
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
