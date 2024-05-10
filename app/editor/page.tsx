"use client"

import {
    Blocks,
    BookOpen,
    ChevronDown,
    Clock,
    Cog,
    FolderOpen,
    HardDrive,
    InfoIcon,
    Moon,
    Package,
    PackageOpen,
    PackagePlus,
    Sun
} from "lucide-react"
import { Button } from "@/components/ui/button"
import packageJson from "@/package.json"
import { useTheme } from "next-themes"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useFilePicker } from "use-file-picker"
import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Error } from "@/components/error"
import { useAsync } from "@/components/use-async"
import { CrateEntry } from "@/components/landing/crate-entry"
import { CrateDataContext } from "@/components/crate-data-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { useRecentCrates } from "@/components/hooks"
import { DeleteCrateModal } from "@/components/delete-crate-modal"

export default function EditorLandingPage() {
    const router = useRouter()
    const theme = useTheme()
    const [error, setError] = useState("")
    const { recentCrates, removeFromRecentCrates } = useRecentCrates()
    const [showStoredCratesAmount, setShowStoredCratesAmount] = useState(5)
    const [showRecentCratesAmount, setShowRecentCratesAmount] = useState(5)
    const { serviceProvider } = useContext(CrateDataContext)
    const { openFilePicker, plainFiles } = useFilePicker({
        accept: ".zip"
    })
    const [deleteCrateModalState, setDeleteCrateModalState] = useState({
        open: false,
        crateId: ""
    })

    const showDeleteCrateModal = useCallback((crateId: string) => {
        setDeleteCrateModalState({
            open: true,
            crateId
        })
    }, [])

    const onDeleteCrateModalOpenChange = useCallback((isOpen: boolean) => {
        setDeleteCrateModalState((old) => ({
            crateId: old.crateId,
            open: isOpen
        }))
    }, [])

    const onShowMoreStoredClick = useCallback(() => {
        setShowStoredCratesAmount((old) => old + 5)
    }, [])

    const onShowMoreRecentClick = useCallback(() => {
        setShowRecentCratesAmount((old) => old + 5)
    }, [])

    const redirectToCrate = useCallback(
        (id: string) => {
            if (id !== "undefined") router.push(`/editor/${id}/entities`)
        },
        [router]
    )

    const createEmptyCrate = useCallback(() => {
        if (serviceProvider) {
            serviceProvider
                .createCrate()
                .then((id) => {
                    redirectToCrate(id)
                })
                .catch((e) => {
                    setError(e.toString())
                })
        }
    }, [serviceProvider, redirectToCrate])

    const createCrateFromCrateZip = useCallback(() => {
        if (plainFiles.length > 0 && serviceProvider) {
            serviceProvider
                .createCrateFromCrateZip(plainFiles[0])
                .then((id) => {
                    redirectToCrate(id)
                })
                .catch((e) => {
                    setError(e.toString())
                })
        }
    }, [serviceProvider, plainFiles, redirectToCrate])

    useEffect(() => {
        if (plainFiles.length > 0 && serviceProvider) {
            createCrateFromCrateZip()
        }
    }, [serviceProvider, createCrateFromCrateZip, plainFiles])

    const storedCratesResolver = useCallback(async () => {
        if (serviceProvider) {
            return await serviceProvider.getStoredCrateIds()
        }

        return []
    }, [serviceProvider])

    const {
        data: storedCrates,
        error: storedCratesError,
        revalidate
    } = useAsync("", storedCratesResolver)

    const showShowMoreStoredButton = useMemo(() => {
        return !!(storedCrates && storedCrates.length > showStoredCratesAmount)
    }, [showStoredCratesAmount, storedCrates])

    const showShowMoreRecentButton = useMemo(() => {
        return !!(recentCrates && recentCrates.length > showRecentCratesAmount)
    }, [recentCrates, showRecentCratesAmount])

    return (
        <div className="flex flex-col w-full h-full">
            <DeleteCrateModal
                open={deleteCrateModalState.open}
                onOpenChange={onDeleteCrateModalOpenChange}
                crateId={deleteCrateModalState.crateId}
                onDeleted={(crateId) => {
                    revalidate()
                    onDeleteCrateModalOpenChange(false)
                    removeFromRecentCrates(crateId)
                }}
            />

            <div className="flex flex-col items-center justify-center h-[max(45vh,200px)] p-10">
                <Package className="w-32 h-32 mb-10" />
                <h2 className="text-5xl font-bold">Editor Name</h2>
            </div>
            <Error text={error} />
            <div className="flex justify-center">
                <Button
                    size="lg"
                    variant="outline"
                    className="border-r-0 rounded-r-none h-16"
                    onClick={() => openFilePicker()}
                >
                    <PackageOpen className="w-6 h-6 mr-3" /> Import Crate
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            size="lg"
                            variant="outline"
                            className="rounded-none border-r-0 h-16"
                        >
                            <PackagePlus className="w-6 h-6 mr-3" /> New Crate{" "}
                            <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={createEmptyCrate}>
                            <PackagePlus className="w-4 h-4 mr-2" />
                            Empty Crate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <FolderOpen className="w-4 h-4 mr-2" /> From Folder
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <Blocks className="w-4 h-4 mr-2" /> Examples
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem>
                                    <Blocks className="w-4 h-4 mr-2" /> Example One
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button size="lg" variant="outline" className="rounded-none border-r-0 h-16">
                    <BookOpen className="w-6 h-6 mr-3" /> Documentation
                </Button>
                <Button size="lg" variant="outline" className="rounded-none border-r-0 h-16">
                    <Cog className="w-6 h-6 mr-3" /> Settings
                </Button>
                <Button
                    size="icon"
                    variant="outline"
                    className="rounded-l-none h-16 w-16"
                    onClick={() => theme.setTheme(theme.theme === "light" ? "dark" : "light")}
                    suppressHydrationWarning
                >
                    {theme.theme === "light" ? (
                        <Sun className="w-6 h-6" suppressHydrationWarning />
                    ) : (
                        <Moon className="w-6 h-6" suppressHydrationWarning />
                    )}
                </Button>
            </div>
            <div className="flex justify-center p-20">
                <div className="flex flex-col w-[min(90vw,1000px)]">
                    <table className="rounded-lg [&_td]:border-t [&_td]:p-2 [&_th]:p-2 [&_th]:text-left">
                        <thead>
                            <tr>
                                <th className="w-0">
                                    <Clock className="w-4 h-4" />
                                </th>
                                <th>Recent Crates</th>
                                <th>Last Opened</th>
                                <th className="w-0">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!recentCrates ? (
                                [0, 0, 0].map((_, i) => {
                                    return (
                                        <tr key={i}>
                                            <td>
                                                <Skeleton className="w-4 h-4" />
                                            </td>
                                            <td>
                                                <Skeleton className="w-full h-8" />
                                            </td>
                                            <td>
                                                <Skeleton className="w-full h-8" />
                                            </td>
                                            <td>
                                                <Skeleton className="w-full h-8" />
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : recentCrates.length === 0 ? (
                                <tr>
                                    <td>
                                        <InfoIcon className="w-4 h-4" />
                                    </td>
                                    <td>
                                        Your recently used crates will be shown here once you start
                                        working on a crate.
                                    </td>
                                    <td />
                                    <td />
                                </tr>
                            ) : (
                                recentCrates.slice(0, showRecentCratesAmount).map((recentCrate) => {
                                    return (
                                        <CrateEntry
                                            key={recentCrate}
                                            crateId={recentCrate}
                                            redirectToCrate={redirectToCrate}
                                            removeFromRecentCrates={removeFromRecentCrates}
                                            isRecentCrate={recentCrates.includes(recentCrate)}
                                            deleteCrate={showDeleteCrateModal}
                                        />
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                    {showShowMoreRecentButton ? (
                        <Button
                            className="w-20 self-center"
                            variant="link"
                            onClick={onShowMoreRecentClick}
                        >
                            Show More
                        </Button>
                    ) : null}
                </div>
            </div>

            <Error text={storedCratesError} />

            <div className="flex justify-center p-20 pt-0">
                <div className="flex flex-col w-[min(90vw,1000px)]">
                    <table className="rounded-lg [&_td]:border-t [&_td]:p-2 [&_th]:p-2 [&_th]:text-left grow">
                        <thead>
                            <tr>
                                <th className="w-0">
                                    <HardDrive className="w-4 h-4" />
                                </th>
                                <th>Stored Crates</th>
                                <th>Last Opened</th>
                                <th className="w-0">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!storedCrates ? (
                                [0, 0, 0].map((_, i) => {
                                    return (
                                        <tr key={i}>
                                            <td>
                                                <Skeleton className="w-4 h-4" />
                                            </td>
                                            <td>
                                                <Skeleton className="w-full h-8" />
                                            </td>
                                            <td>
                                                <Skeleton className="w-full h-8" />
                                            </td>
                                            <td>
                                                <Skeleton className="w-full h-8" />
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : storedCrates.length === 0 ? (
                                <tr>
                                    <td>
                                        <InfoIcon className="w-4 h-4" />
                                    </td>
                                    <td>A list of all your crates will be shown here.</td>
                                    <td />
                                    <td />
                                </tr>
                            ) : (
                                storedCrates
                                    .slice(0, showStoredCratesAmount)
                                    .map((recentCrate) => (
                                        <CrateEntry
                                            key={recentCrate}
                                            crateId={recentCrate}
                                            redirectToCrate={redirectToCrate}
                                            removeFromRecentCrates={removeFromRecentCrates}
                                            isRecentCrate={recentCrates?.includes(recentCrate)}
                                            deleteCrate={showDeleteCrateModal}
                                        />
                                    ))
                            )}
                        </tbody>
                    </table>
                    {showShowMoreStoredButton ? (
                        <Button
                            className="w-20 self-center"
                            variant="link"
                            onClick={onShowMoreStoredClick}
                        >
                            Show More
                        </Button>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-col items-center text-muted-foreground pb-4">
                <div>
                    {packageJson.name} v{packageJson.version}
                </div>
            </div>
        </div>
    )
}
