import { EntityEditorProperty } from "@/components/entity-editor"
import { isReference } from "@/lib/utils"
import { getPropertyComment, getPropertyDomain } from "@/lib/schema-helpers"
import { Button } from "@/components/ui/button"
import { ArrowLeftRight, EllipsisVertical, Eraser, Trash } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { ChangeEvent, useCallback, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command"
import { Checkbox } from "@/components/ui/checkbox"
import { Context } from "@/lib/crate-verify/context"

export interface PropertyEditorProps {
    property: EntityEditorProperty
    onModifyProperty: (
        propertyName: string,
        value: FlatEntitySinglePropertyTypes,
        valueIdx: number
    ) => void
}

export interface SinglePropertyEditorProps extends PropertyEditorProps {
    valueIndex: number
}

function SelectReferenceModal({
    open,
    onSelect,
    onOpenChange
}: {
    open: boolean
    onSelect: (ref: Reference) => void
    onOpenChange: (open: boolean) => void
}) {
    const possibleEntities = useMemo(() => {
        return ["One", "Two", "Three"]
    }, [])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select Entity to Reference</DialogTitle>
                    <Command className="py-2" onSelect={(el) => {}}>
                        <CommandInput placeholder="Search all matching entities..." />
                        <CommandList>
                            <CommandEmpty>No results found.</CommandEmpty>
                            <CommandGroup>
                                {possibleEntities.map((e) => {
                                    return (
                                        <CommandItem className="text-md" key={e}>
                                            {e}
                                        </CommandItem>
                                    )
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>

                    <div className="flex gap-2 items-center">
                        <Checkbox checked id="onlyShowMatching" />
                        <label htmlFor="onlyShowMatching">
                            Only show Entities of matching type
                        </label>
                    </div>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}

function TextField({
    value,
    onChange
}: {
    value: string
    onChange: (value: ChangeEvent<HTMLInputElement>) => void
}) {
    return <Input value={value} onChange={onChange} className="self-center rounded-r-none" />
}

const context = new Context("https://w3id.org/ro/crate/1.1/context")

function ReferenceField({
    value,
    propertyName,
    onChange
}: {
    value: Reference
    onChange: (value: Reference) => void
    propertyName: string
}) {
    const [selectModalOpen, setSelectModalOpen] = useState(false)

    const onSelect = useCallback((selection: Reference) => {
        console.log("selected", selection)
    }, [])

    const referenceTypeDomain = useMemo(() => {
        const resolved = context.resolve(propertyName)
        if (!resolved) return []
        return getPropertyDomain(resolved).map((r) => r["@id"])
    }, [propertyName])

    return (
        <>
            <SelectReferenceModal
                open={selectModalOpen}
                onSelect={onSelect}
                onOpenChange={setSelectModalOpen}
            />
            <Button
                className="grow rounded-r-none"
                onClick={() => {
                    setSelectModalOpen(true)
                }}
            >
                Change Reference {referenceTypeDomain}
            </Button>
        </>
    )
}

function SinglePropertyEditor({
    property,
    onModifyProperty,
    valueIndex
}: SinglePropertyEditorProps) {
    const value = property.values[valueIndex]
    const onReferenceChange = useCallback((value: Reference) => {}, [])
    const onTextChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            onModifyProperty(property.propertyName, e.target.value, valueIndex)
        },
        [onModifyProperty, property.propertyName, valueIndex]
    )

    return (
        <div className="flex w-full">
            {isReference(value) ? (
                <ReferenceField
                    value={value}
                    onChange={onReferenceChange}
                    propertyName={property.propertyName}
                />
            ) : (
                <TextField value={value} onChange={onTextChange} />
            )}

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-l-0 rounded-l-none">
                        <EllipsisVertical />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>
                        <Eraser className="w-4 h-4 mr-2" /> Clear
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <ArrowLeftRight className="w-4 h-4 mr-2" /> Change Type
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <Trash className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

export function PropertyEditor(props: PropertyEditorProps) {
    return (
        <div className="grid grid-cols-[1fr_1fr] w-full">
            <div className="pr-4">
                <div>{props.property.propertyName}</div>
                <div className="text-muted-foreground text-sm">
                    {getPropertyComment("schema:" + props.property.propertyName) + ""}
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {props.property.values.map((v, i) => {
                    return (
                        <SinglePropertyEditor
                            key={i}
                            valueIndex={i}
                            property={props.property}
                            onModifyProperty={props.onModifyProperty}
                        />
                    )
                })}
            </div>
        </div>
    )
}
