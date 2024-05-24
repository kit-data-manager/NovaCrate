"use client"

import {
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
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useFilePicker } from "use-file-picker"
import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Error } from "@/components/error"
import { CrateEntry } from "@/components/landing/crate-entry"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { useAsync, useRecentCrates } from "@/lib/hooks"
import { DeleteCrateModal } from "@/components/landing/delete-crate-modal"
import { CreateCrateModal } from "@/components/landing/create-crate-modal"

export default function EditorLandingPage() {
    const router = useRouter()
    const theme = useTheme()
    const { recentCrates, removeFromRecentCrates } = useRecentCrates()
    const [showStoredCratesAmount, setShowStoredCratesAmount] = useState(5)
    const [showRecentCratesAmount, setShowRecentCratesAmount] = useState(5)
    const { serviceProvider } = useContext(CrateDataContext)
    const { openFilePicker: openZipFilePicker, plainFiles: zipFiles } = useFilePicker({
        accept: ".zip"
    })

    const [deleteCrateModalState, setDeleteCrateModalState] = useState({
        open: false,
        crateId: ""
    })
    const [createCrateModalState, setCreateCrateModalState] = useState({
        open: false,
        fromFolder: false,
        fromExample: undefined as undefined | string,
        fromZip: undefined as File | undefined
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

    const onCreateCrateModalOpenChange = useCallback((isOpen: boolean) => {
        setCreateCrateModalState((old) => ({
            ...old,
            open: isOpen
        }))
    }, [])

    const createEmptyCrate = useCallback(() => {
        setCreateCrateModalState({
            fromExample: undefined,
            fromFolder: false,
            fromZip: undefined,
            open: true
        })
    }, [])

    const createCrateFromFolder = useCallback(() => {
        setCreateCrateModalState({
            fromExample: undefined,
            fromFolder: true,
            fromZip: undefined,
            open: true
        })
    }, [])

    // const createCrateFromExample = useCallback((example: string) => {
    //     setCreateCrateModalState({
    //         fromExample: example,
    //         fromFolder: false,
    //         open: true
    //     })
    // }, [])

    useEffect(() => {
        if (zipFiles.length > 0) {
            setCreateCrateModalState({
                fromExample: undefined,
                fromFolder: false,
                fromZip: zipFiles[0],
                open: true
            })
        }
    }, [zipFiles])

    const onShowMoreStoredClick = useCallback(() => {
        setShowStoredCratesAmount((old) => old + 5)
    }, [])

    const onShowMoreRecentClick = useCallback(() => {
        setShowRecentCratesAmount((old) => old + 5)
    }, [])

    const openEditor = useCallback(
        (id: string) => {
            if (id !== "undefined") router.push(`/editor/${id}/entities`)
        },
        [router]
    )

    const storedCratesResolver = useCallback(async () => {
        if (serviceProvider) {
            return await serviceProvider.getStoredCrateIds()
        } else return []
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
            <CreateCrateModal
                {...createCrateModalState}
                onOpenChange={onCreateCrateModalOpenChange}
                openEditor={openEditor}
            />

            <div className="flex flex-col items-center justify-center h-[max(45vh,200px)] p-10">
                <Package className="w-32 h-32 mb-10" />
                <h2 className="text-5xl font-bold">Editor Name</h2>
            </div>

            <div className="flex justify-center">
                <Button
                    size="lg"
                    variant="outline"
                    className="border-r-0 rounded-r-none h-16"
                    onClick={() => openZipFilePicker()}
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
                        <DropdownMenuItem onClick={createCrateFromFolder}>
                            <FolderOpen className="w-4 h-4 mr-2" /> From Folder
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={createEmptyCrate}>
                            <PackagePlus className="w-4 h-4 mr-2" />
                            Empty Crate
                        </DropdownMenuItem>
                        {/*<DropdownMenuSub>*/}
                        {/*    <DropdownMenuSubTrigger>*/}
                        {/*        <Blocks className="w-4 h-4 mr-2" /> Examples*/}
                        {/*    </DropdownMenuSubTrigger>*/}
                        {/*    <DropdownMenuSubContent>*/}
                        {/*        <DropdownMenuItem>*/}
                        {/*            <Blocks className="w-4 h-4 mr-2" /> Example One*/}
                        {/*        </DropdownMenuItem>*/}
                        {/*    </DropdownMenuSubContent>*/}
                        {/*</DropdownMenuSub>*/}
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
                                            openEditor={openEditor}
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

            <div className="flex justify-center p-20 pt-0 w-full">
                <div className="flex flex-col w-[min(90vw,1000px)]">
                    <Error title="Failed to fetch stored crates" error={storedCratesError} />
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
                                            openEditor={openEditor}
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
