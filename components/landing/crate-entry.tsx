import {
    Download,
    EllipsisVertical,
    FileIcon,
    FolderArchive,
    Notebook,
    PackagePlus,
    Trash
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { usePersistence } from "@/components/providers/persistence-provider"
import { CrateFactory } from "@/lib/core/impl/CrateFactory"
import { downloadCrateAs } from "@/lib/core/util"
import { getEntityDisplayName, getRootEntityID } from "@/lib/utils"
import { crateDetailsKey } from "@/components/landing/util"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Error } from "@/components/error"
import { DateTime } from "luxon"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { toast } from "sonner"

export interface CrateDetails {
    name?: string
    lastOpened?: string
}

export function CrateEntry({
    crateId,
    openEditor,
    deleteCrate,
    search
}: {
    crateId: string
    openEditor(id: string): void
    deleteCrate(id: string): void
    search: string
}) {
    const persistence = usePersistence()
    const { showCrateExportedModal } = useContext(GlobalModalContext)
    const [crateDetails, setCrateDetails] = useState<CrateDetails | undefined>()
    const [error, setError] = useState<unknown>()

    useEffect(() => {
        const content = window.localStorage.getItem(crateDetailsKey(crateId))
        if (content) {
            try {
                const result = JSON.parse(content)
                setCrateDetails(result as CrateDetails)
            } catch (e) {
                console.warn("Cloud not read crate details", crateId, e)
            }
        }

        // Try to read metadata to get the crate name
        persistence
            .createCrateServiceFor(crateId)
            .then(async (cs) => {
                if (!cs) return
                const raw = await cs.getMetadata()
                const crate = JSON.parse(raw) as ICrate
                const rootID = getRootEntityID(crate["@graph"])
                const root = rootID ? crate["@graph"].find((e) => e["@id"] === rootID) : undefined
                if (root) {
                    setCrateDetails((old) => {
                        const data = {
                            ...old,
                            name: getEntityDisplayName(root)
                        }

                        window.localStorage.setItem(crateDetailsKey(crateId), JSON.stringify(data))

                        return data
                    })
                }
            })
            .catch((e: unknown) => {
                console.warn("Failed to fetch crate details from server", e)
                setError(e)
            })
    }, [persistence, crateId])

    const title = useMemo(() => {
        if (crateDetails && crateDetails.name) {
            return <div>{crateDetails.name ?? null}</div>
        } else {
            return <code>{crateId}</code>
        }
    }, [crateDetails, crateId])

    const [createCrateCopyError, setCreateCrateCopyError] = useState<unknown>(undefined)
    const createCrateCopy = useCallback(async () => {
        try {
            const factory = new CrateFactory(persistence)
            const newCrateID = await factory.duplicateCrate(
                crateId,
                "Copy of " + (crateDetails?.name ?? crateId)
            )
            if (newCrateID) openEditor(newCrateID)
        } catch (e) {
            setCreateCrateCopyError(e)
        }
    }, [crateDetails?.name, crateId, openEditor, persistence])

    if (search && !crateDetails) return null
    if (search && !crateDetails?.name?.toUpperCase().includes(search.toUpperCase())) return null

    return (
        <div className="grid grid-cols-[4fr_2fr_112px] gap-4 w-full transition hover:bg-secondary p-2 rounded-lg">
            <div className="flex flex-col justify-center">
                {title}
                <Error
                    title="Could not fetch details for this crate"
                    error={error}
                    warn={!!(crateDetails && crateDetails.name)}
                />
                <Error title="Could not create a copy of this crate" error={createCrateCopyError} />
            </div>
            <div className="flex items-center text-muted-foreground text-sm">
                {crateDetails && crateDetails.lastOpened
                    ? DateTime.fromISO(crateDetails.lastOpened).toLocaleString({
                          timeStyle: "medium",
                          dateStyle: "long"
                      })
                    : "Never"}
            </div>
            <div className="flex gap-2">
                <Button
                    onClick={() => {
                        openEditor(crateId)
                    }}
                    size="sm"
                >
                    Open
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" title={"More"}>
                            <EllipsisVertical className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={createCrateCopy}>
                            <PackagePlus className="size-4 mr-2" /> Create a Copy
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <Download className="size-4 mr-2" /> Export...
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem
                                    onClick={async () => {
                                        const repo = persistence.getRepositoryService()
                                        if (repo) {
                                            try {
                                                await downloadCrateAs(
                                                    repo,
                                                    crateId,
                                                    "zip",
                                                    "crate.zip"
                                                )
                                                showCrateExportedModal()
                                            } catch (e) {
                                                console.error("Failed to export crate as .zip", e)
                                                toast.error("Failed to export crate as .zip")
                                            }
                                        }
                                    }}
                                >
                                    <FolderArchive className="size-4 mr-2" /> As .zip Archive
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={async () => {
                                        const repo = persistence.getRepositoryService()
                                        if (repo) {
                                            try {
                                                await downloadCrateAs(
                                                    repo,
                                                    crateId,
                                                    "eln",
                                                    "crate.eln"
                                                )
                                                showCrateExportedModal()
                                            } catch (e) {
                                                console.error("Failed to export crate as .eln", e)
                                                toast.error("Failed to export crate as .eln")
                                            }
                                        }
                                    }}
                                >
                                    <Notebook className="size-4 mr-2" /> As ELN
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={async () => {
                                        const repo = persistence.getRepositoryService()
                                        if (repo) {
                                            try {
                                                await downloadCrateAs(
                                                    repo,
                                                    crateId,
                                                    "standalone-json",
                                                    "ro-crate-metadata.json"
                                                )
                                                showCrateExportedModal()
                                            } catch (e) {
                                                console.error("Failed to export crate as JSON", e)
                                                toast.error("Failed to export crate as JSON")
                                            }
                                        }
                                    }}
                                >
                                    <FileIcon className="size-4 mr-2" /> ro-crate-metadata.json
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            variant={"destructive"}
                            onClick={() => {
                                deleteCrate(crateId)
                            }}
                        >
                            <Trash className="size-4 mr-2" /> Permanently Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
