import { Context } from "@/lib/crate-verify/context"
import { useCallback, useMemo, useState } from "react"
import { getPropertyRange } from "@/lib/schema-helpers"
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
    Globe,
    LinkIcon,
    Plus,
    Trash,
    Unlink
} from "lucide-react"
import { CreateEntityModal } from "@/components/editor/create-entity-modal"
import { CreateFromORCIDModal } from "@/components/editor/from-orcid-modal"

const TEST_CONTEXT = new Context("https://w3id.org/ro/crate/1.1/context")

export function ReferenceField({
    value,
    propertyName,
    onChange
}: {
    value: IReference
    onChange: (value: IReference) => void
    propertyName: string
}) {
    const [selectModalOpen, setSelectModalOpen] = useState(false)
    const [createModalOpen, setCreateModalOpen] = useState(false)

    const onSelect = useCallback((selection: IReference) => {
        console.log("selected", selection)
    }, [])

    const referenceTypeRange = useMemo(() => {
        const resolved = TEST_CONTEXT.resolve(propertyName)
        if (!resolved) return []
        return getPropertyRange(resolved)
            .map((s) => TEST_CONTEXT.reverse(s))
            .filter((s) => typeof s === "string") as string[]
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
                    <CreateFromExternalButton propertyRange={referenceTypeRange} />
                    <Button
                        className="grow rounded-r-none border-r-0 first:rounded-l-md rounded-l-none"
                        variant="outline"
                        onClick={() => {
                            setCreateModalOpen(true)
                        }}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create
                    </Button>
                    <Button
                        className="grow rounded-none"
                        variant="outline"
                        onClick={() => {
                            setSelectModalOpen(true)
                        }}
                    >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Select
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
                        <span>Monika Musterfrau</span>
                        <span className="text-muted-foreground ml-1 text-xs">{value["@id"]}</span>
                    </div>
                </Button>
            )}

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-l-0 rounded-l-none px-2">
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

function CreateFromExternalButton({ propertyRange }: { propertyRange: string[] }) {
    const [modalOpen, setModalOpen] = useState(false)

    const openModal = useCallback(() => {
        setModalOpen(true)
    }, [])

    const fromORCID = useMemo(() => {
        return propertyRange.includes("Person")
    }, [propertyRange])
    const fromROR = useMemo(() => {
        return propertyRange.includes("Organization")
    }, [propertyRange])

    if (fromORCID) {
        return (
            <>
                <CreateFromORCIDModal
                    open={modalOpen}
                    onEntityCreated={() => {}}
                    onOpenChange={setModalOpen}
                />
                <Button className="grow-[2] rounded-r-none" onClick={openModal}>
                    <Globe className="w-4 h-4 mr-2" /> From ORCID
                </Button>
            </>
        )
    } else if (fromROR) {
        return (
            <>
                <Button className="grow-[2] rounded-r-none" onClick={openModal}>
                    <Globe className="w-4 h-4 mr-2" /> From ROR
                </Button>
            </>
        )
    }
    return null
}
