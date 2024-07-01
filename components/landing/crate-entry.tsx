import {
    Copy,
    Download,
    EllipsisVertical,
    FileIcon,
    FolderArchive,
    Package,
    Trash,
    XIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { getEntityDisplayName } from "@/lib/utils"
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
import { useCopyToClipboard } from "usehooks-ts"

export interface CrateDetails {
    name?: string
    lastOpened?: string
}

export function CrateEntry({
    crateId,
    openEditor,
    deleteCrate,
    removeFromRecentCrates,
    isRecentCrate
}: {
    crateId: string
    isRecentCrate?: boolean
    removeFromRecentCrates(id: string): void
    openEditor(id: string): void
    deleteCrate(id: string): void
}) {
    const { serviceProvider } = useContext(CrateDataContext)
    const [crateDetails, setCrateDetails] = useState<CrateDetails | undefined>()
    const [error, setError] = useState<unknown>()
    const [_, copyText] = useCopyToClipboard()

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

        if (serviceProvider) {
            serviceProvider
                .getCrate(crateId)
                .then((crate) => {
                    const root = crate["@graph"].find((e) => e["@id"] === "./")
                    if (root) {
                        setCrateDetails((old) => {
                            const data = {
                                ...old,
                                name: getEntityDisplayName(root)
                            }

                            window.localStorage.setItem(
                                crateDetailsKey(crateId),
                                JSON.stringify(data)
                            )

                            return data
                        })
                    }
                })
                .catch((e) => {
                    console.warn("Failed to fetch crate details from server", e)
                    setError(e)
                })
        }
    }, [serviceProvider, crateId])

    const copyInternalID = useCallback(() => {
        copyText(crateId).then()
    }, [copyText, crateId])

    const title = useMemo(() => {
        if (crateDetails && crateDetails.name) {
            return <div>{crateDetails.name ?? null}</div>
        } else {
            return <code>{crateId}</code>
        }
    }, [crateDetails, crateId])

    return (
        <div className="grid grid-cols-[20px_4fr_2fr_112px] gap-4 w-full transition hover:bg-secondary p-2 rounded-lg">
            <div className="flex flex-col items-center justify-center">
                <Package className="w-4 h-4" />
            </div>
            <div className="flex flex-col justify-center">
                {title}
                <Error
                    title="Could not fetch details for this crate"
                    error={error}
                    warn={!!(crateDetails && crateDetails.name)}
                />
            </div>
            <div className="flex flex-col items-center justify-center text-muted-foreground text-sm">
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
                        <Button variant="outline" size="sm">
                            <EllipsisVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuSub>
                            {isRecentCrate ? (
                                <DropdownMenuItem
                                    onClick={() => {
                                        removeFromRecentCrates(crateId)
                                    }}
                                >
                                    <XIcon className="w-4 h-4 mr-2" /> Remove from recently used
                                </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuSubTrigger>
                                <Download className="w-4 h-4 mr-2" /> Export...
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem
                                    onClick={() => {
                                        if (serviceProvider) {
                                            serviceProvider.downloadCrateZip(crateId).then()
                                        }
                                    }}
                                >
                                    <FolderArchive className="w-4 h-4 mr-2" /> As .zip Archive
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => {
                                        if (serviceProvider) {
                                            serviceProvider
                                                .downloadRoCrateMetadataJSON(crateId)
                                                .then()
                                        }
                                    }}
                                >
                                    <FileIcon className="w-4 h-4 mr-2" /> ro-crate-metadata.json
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuItem onClick={copyInternalID}>
                            <Copy className="w-4 h-4 mr-2" /> Copy internal Identifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="bg-destructive text-destructive-foreground"
                            onClick={() => {
                                deleteCrate(crateId)
                            }}
                        >
                            <Trash className="w-4 h-4 mr-2" /> Permanently Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
