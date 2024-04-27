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
import { Skeleton } from "@/components/ui/skeleton"
import { getAllClasses, SlimClass } from "@/lib/crate-verify/helpers"
import React, { ChangeEvent, useCallback, useMemo, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus } from "lucide-react"
import { useAutoId } from "@/components/use-auto-id"
import { AutoReference } from "@/components/global-modals-provider"
import { propertyNameReadable } from "@/lib/utils"
import { useEditorState } from "@/components/editor-state"

function CreateEntityModalEntry({
    slimClass,
    onSelect
}: {
    slimClass: SlimClass
    onSelect: (value: string) => void
}) {
    const crateContext = useEditorState.useCrateContext()

    const readableName = useMemo(() => {
        return propertyNameReadable(crateContext.reverse(slimClass["@id"]) || slimClass["@id"])
    }, [crateContext, slimClass])

    return (
        <CommandItem
            className="text-md"
            key={slimClass["@id"]}
            onSelect={onSelect}
            value={readableName}
        >
            <div className="flex flex-col max-w-full w-full py-1">
                <div className="flex justify-between">
                    <div>{readableName}</div>
                </div>
                <div className="truncate text-xs">
                    <span>{slimClass.comment + ""}</span>
                </div>
            </div>
        </CommandItem>
    )
}

function TypeSelect({
    open,
    restrictToClasses,
    onTypeSelect
}: {
    open: boolean
    restrictToClasses?: SlimClass[]
    onTypeSelect: (value: string) => void
}) {
    const crateContext = useEditorState.useCrateContext()
    const [bypassRestrictions, setBypassRestrictions] = useState(false)

    const toggleRestrictions = useCallback((state: boolean | "indeterminate") => {
        setBypassRestrictions(state === "indeterminate" ? true : !state)
    }, [])

    const types = useMemo(() => {
        if (bypassRestrictions || !restrictToClasses) {
            return getAllClasses()
        } else {
            if (restrictToClasses) {
                return restrictToClasses.filter((c) => crateContext.reverse(c["@id"])) // Reversible classes are known via specification
            } else return []
        }
    }, [bypassRestrictions, crateContext, restrictToClasses])

    return (
        <>
            {" "}
            <Command className="py-2">
                <CommandInput placeholder="Search all matching Classes..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup>
                        {open ? (
                            types.map((e) => (
                                <CreateEntityModalEntry
                                    key={e["@id"]}
                                    slimClass={e}
                                    onSelect={onTypeSelect}
                                />
                            ))
                        ) : (
                            <>
                                <Skeleton className={"w-10 h-4"} />
                            </>
                        )}
                    </CommandGroup>
                </CommandList>
            </Command>
            <div className="flex gap-2 items-center">
                <Checkbox
                    checked={!bypassRestrictions}
                    onCheckedChange={toggleRestrictions}
                    id="onlyShowAllowed-create"
                />
                <label htmlFor="onlyShowAllowed-create">Only show valid Types</label>
            </div>
        </>
    )
}

function CreateEntity({
    onBackClick,
    onCreateClick
}: {
    onBackClick: () => void
    onCreateClick: (id: string, name: string) => void
}) {
    const [name, setName] = useState("")
    const [identifier, setIdentifier] = useState<null | string>(null)

    const onNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value)
    }, [])

    const onIdentifierChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setIdentifier(e.target.value)
    }, [])

    const _autoId = useAutoId(identifier || name)

    const autoId = useMemo(() => {
        return identifier || _autoId
    }, [_autoId, identifier])

    const localOnCreateClick = useCallback(() => {
        onCreateClick(autoId, name)
    }, [autoId, name, onCreateClick])

    const onNameInputKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                localOnCreateClick()
            }
        },
        [localOnCreateClick]
    )

    return (
        <div className="flex flex-col gap-4">
            <div>
                <Label>Identifier</Label>
                <Input placeholder={"#localname"} value={autoId} onChange={onIdentifierChange} />
            </div>

            <div>
                <Label>Name</Label>
                <Input
                    value={name}
                    placeholder={"Entity Name"}
                    onChange={onNameChange}
                    autoFocus
                    onKeyDown={onNameInputKeyDown}
                />
            </div>

            <div className="mt-2 flex justify-between">
                <Button variant="secondary" onClick={() => onBackClick()}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={() => localOnCreateClick()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create
                </Button>
            </div>
        </div>
    )
}

export function CreateEntityModal({
    open,
    onEntityCreated,
    onOpenChange,
    restrictToClasses,
    autoReference
}: {
    open: boolean
    onEntityCreated: () => void
    onOpenChange: (open: boolean) => void
    restrictToClasses?: SlimClass[]
    autoReference?: AutoReference
}) {
    const addEntity = useEditorState.useAddEntity()

    const [selectedType, setSelectedType] = useState("")

    const onTypeSelect = useCallback((value: string) => {
        setSelectedType(value)
    }, [])

    const localOnOpenChange = useCallback(
        (isOpen: boolean) => {
            setSelectedType("")
            onOpenChange(isOpen)
        },
        [onOpenChange]
    )

    const onCreate = useCallback(
        (id: string, name: string) => {
            if (
                addEntity(
                    id,
                    [selectedType],
                    {
                        name
                    },
                    autoReference
                )
            ) {
                onEntityCreated()
                setSelectedType("")
            }
        },
        [addEntity, autoReference, onEntityCreated, selectedType]
    )

    const backToTypeSelect = useCallback(() => {
        setSelectedType("")
    }, [])

    return (
        <Dialog open={open} onOpenChange={localOnOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {selectedType ? `Create new ${selectedType}` : "Select Type of new Entity"}
                    </DialogTitle>
                </DialogHeader>

                {!selectedType ? (
                    <TypeSelect
                        open={open}
                        restrictToClasses={restrictToClasses}
                        onTypeSelect={onTypeSelect}
                    />
                ) : (
                    <CreateEntity onBackClick={backToTypeSelect} onCreateClick={onCreate} />
                )}
            </DialogContent>
        </Dialog>
    )
}
