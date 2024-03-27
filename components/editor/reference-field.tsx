import { Context } from "@/lib/crate-verify/context"
import { useCallback, useMemo, useState } from "react"
import { getPropertyDomain, getPropertyRange } from "@/lib/schema-helpers"
import { Button } from "@/components/ui/button"
import { SelectReferenceModal } from "@/components/editor/select-reference-modal"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
    ArrowLeftRight,
    EllipsisVertical,
    Eraser,
    LinkIcon,
    Plus,
    Trash,
    Unlink
} from "lucide-react"
import Link from "next/link"
import { CreateEntityModal } from "@/components/editor/create-entity-modal"

const TEST_CONTEXT = new Context("https://w3id.org/ro/crate/1.1/context")

export function ReferenceField({
    value,
    propertyName,
    onChange
}: {
    value: Reference
    onChange: (value: Reference) => void
    propertyName: string
}) {
    const [selectModalOpen, setSelectModalOpen] = useState(false)
    const [createModalOpen, setCreateModalOpen] = useState(false)

    const onSelect = useCallback((selection: Reference) => {
        console.log("selected", selection)
    }, [])

    const referenceTypeRange = useMemo(() => {
        const resolved = TEST_CONTEXT.resolve(propertyName)
        if (!resolved) return []
        return getPropertyRange(resolved)
    }, [propertyName])

    const isEmpty = useMemo(() => {
        return value["@id"] === ""
    }, [value])

    return (
        <div className="flex w-full">
            <SelectReferenceModal
                open={selectModalOpen}
                onSelect={onSelect}
                onOpenChange={setSelectModalOpen}
            />
            <CreateEntityModal
                open={createModalOpen}
                onEntityCreated={onSelect}
                onOpenChange={setCreateModalOpen}
                restrictToClasses={referenceTypeRange}
            />

            {isEmpty ? (
                <>
                    <Button
                        className="grow rounded-r-none border-r-0"
                        variant="outline"
                        onClick={() => {
                            setCreateModalOpen(true)
                        }}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create New
                    </Button>
                    <Button
                        className="grow rounded-none"
                        variant="outline"
                        onClick={() => {
                            setSelectModalOpen(true)
                        }}
                    >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Link Existing
                    </Button>
                </>
            ) : (
                <Button
                    className="grow rounded-r-none justify-start pl-3"
                    variant="outline"
                    onClick={() => {
                        setSelectModalOpen(true)
                    }}
                >
                    <LinkIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                    <div className="flex items-end">
                        <span>Unresolved</span>
                        <span className="text-muted-foreground ml-1 text-xs">{value["@id"]}</span>
                    </div>
                </Button>
            )}

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-l-0 rounded-l-none">
                        <EllipsisVertical />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem disabled={isEmpty}>
                        <Unlink className="w-4 h-4 mr-2" /> Clear
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
