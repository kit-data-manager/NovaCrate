import { useCallback, useContext, useMemo, useState } from "react"
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
import { useAsync } from "@/components/use-async"
import { Error } from "@/components/error"
import { CrateVerifyContext } from "@/components/crate-verify-provider"
import { TEST_CONTEXT } from "@/components/crate-data-provider"

export function ReferenceField({
    value,
    propertyName,
    onChange
}: {
    value: IReference
    onChange: (value: IReference) => void
    propertyName: string
}) {
    const { isReady: crateVerifyReady, getPropertyRange } = useContext(CrateVerifyContext)

    const [selectModalOpen, setSelectModalOpen] = useState(false)
    const [createModalOpen, setCreateModalOpen] = useState(false)

    const onSelect = useCallback((selection: IReference) => {
        console.log("selected", selection)
    }, [])

    const referenceTypeRangeResolver = useCallback(
        async (propertyName: string) => {
            if (crateVerifyReady) {
                const resolved = TEST_CONTEXT.resolve(propertyName)
                if (!resolved) return []
                const data = await getPropertyRange(resolved)
                return data
                    .map((s) => TEST_CONTEXT.reverse(s))
                    .filter((s) => typeof s === "string") as string[]
            }
        },
        [crateVerifyReady, getPropertyRange]
    )

    const { data: referenceTypeRange, error: referenceTypeRangeError } = useAsync(
        crateVerifyReady ? propertyName : null,
        referenceTypeRangeResolver
    )

    const isEmpty = useMemo(() => {
        return value["@id"] === ""
    }, [value])

    return (
        <div className="flex w-full">
            <Error text={referenceTypeRangeError} />
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

function CreateFromExternalButton({ propertyRange }: { propertyRange?: string[] }) {
    const [modalOpen, setModalOpen] = useState(false)

    const openModal = useCallback(() => {
        setModalOpen(true)
    }, [])

    const fromORCID = useMemo(() => {
        if (!propertyRange) return false
        return propertyRange.includes("Person")
    }, [propertyRange])

    const fromROR = useMemo(() => {
        if (!propertyRange) return false
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
                <Button className="grow-[2] rounded-r-none animate-w-grow" onClick={openModal}>
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
