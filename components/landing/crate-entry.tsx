import {
    EllipsisVertical,
    FileIcon,
    FolderArchive,
    HardDriveDownload,
    Package,
    Trash,
    XIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useContext, useEffect, useMemo, useState } from "react"
import { CrateDataContext } from "@/components/crate-data-provider"
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

interface CrateDetails {
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
    const [error, setError] = useState("")

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

    const title = useMemo(() => {
        if (crateDetails) {
            return (
                <>
                    <div>{crateDetails.name ?? null}</div>
                    <div className="text-muted-foreground text-xs flex items-center">{crateId}</div>
                </>
            )
        } else {
            return <div>{crateId}</div>
        }
    }, [crateDetails, crateId])

    return (
        <tr>
            <td>
                <Package className="w-4 h-4" />
            </td>
            <td>
                {title}
                <Error text={error} />
            </td>
            <td>
                {crateDetails && crateDetails.lastOpened
                    ? new Date(crateDetails.lastOpened).toLocaleDateString() +
                      ", " +
                      new Date(crateDetails.lastOpened).toLocaleTimeString()
                    : null}
            </td>
            <td className="flex gap-2">
                <Button
                    onClick={() => {
                        openEditor(crateId)
                    }}
                >
                    Open
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
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
                                <HardDriveDownload className="w-4 h-4 mr-2" /> Export...
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem>
                                    <FolderArchive className="w-4 h-4 mr-2" /> Crate as .zip
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <FileIcon className="w-4 h-4 mr-2" /> ro-crate-metadata.json
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="bg-destructive"
                            onClick={() => {
                                deleteCrate(crateId)
                            }}
                        >
                            <Trash className="w-4 h-4 mr-2" /> Permanently Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </td>
        </tr>
    )
}
