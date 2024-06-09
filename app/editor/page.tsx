"use client"

import {
    BookOpen,
    ChevronDown,
    Clock,
    Cog,
    FolderOpen,
    HardDrive,
    Loader,
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
import { CrateEntry } from "@/components/landing/crate-entry"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { useAsync, useRecentCrates } from "@/lib/hooks"
import { DeleteCrateModal } from "@/components/landing/delete-crate-modal"
import { CreateCrateModal } from "@/components/landing/create-crate-modal"
import { Error } from "@/components/error"

export default function EditorLandingPage() {
    const router = useRouter()
    const theme = useTheme()
    const { recentCrates, removeFromRecentCrates } = useRecentCrates()
    const [showStoredCratesAmount, setShowStoredCratesAmount] = useState(5)
    const [showRecentCratesAmount, setShowRecentCratesAmount] = useState(5)
    const { serviceProvider, setCrateId, unsetCrateId } = useContext(CrateDataContext)
    const { openFilePicker: openZipFilePicker, plainFiles: zipFiles } = useFilePicker({
        accept: ".zip"
    })

    useEffect(() => {
        console.debug("Unsetting crate ID")
        unsetCrateId()
    }, [unsetCrateId])

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
            if (id !== "undefined") {
                setCrateId(id)
                router.push(`/editor/full/entities`)
            }
        },
        [router, setCrateId]
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
        <div className="w-full h-full grid grid-cols-[1fr_2fr]">
            <div className="bg-accent h-full flex flex-col">
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
                    <h2 className="text-5xl font-bold">NovaCrate</h2>
                </div>

                <div className="flex flex-col items-center pr-20">
                    <div className="flex items-start flex-col">
                        <Button
                            size="lg"
                            variant="link"
                            className="border-r-0 rounded-r-none h-12"
                            onClick={() => openZipFilePicker()}
                        >
                            <PackageOpen className="w-6 h-6 mr-3" /> Import Crate
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    size="lg"
                                    variant="link"
                                    className="rounded-none border-r-0 h-12"
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

                        <Button size="lg" variant="link" className="rounded-none border-r-0 h-12">
                            <BookOpen className="w-6 h-6 mr-3" /> Documentation
                        </Button>
                        <Button size="lg" variant="link" className="rounded-none border-r-0 h-12">
                            <Cog className="w-6 h-6 mr-3" /> Settings
                        </Button>
                        <Button
                            size="lg"
                            variant="link"
                            className="rounded-none border-r-0 h-12"
                            onClick={() =>
                                theme.setTheme(theme.theme === "light" ? "dark" : "light")
                            }
                            suppressHydrationWarning
                        >
                            {theme.theme === "light" ? (
                                <Sun className="w-6 h-6 mr-3 shrink-0" suppressHydrationWarning />
                            ) : (
                                <Moon className="w-6 h-6 mr-3 shrink-0" suppressHydrationWarning />
                            )}{" "}
                            Toggle Theme
                        </Button>
                    </div>
                </div>

                <div className="grow" />

                <div className="flex flex-col items-center text-muted-foreground pb-4">
                    <div>
                        {packageJson.name} v{packageJson.version}
                    </div>
                </div>
            </div>

            <div className="h-full overflow-y-auto">
                <div className="grid grid-cols-2 p-20 pb-0 gap-8 max-w-[1000px] ml-auto mr-auto">
                    <button
                        className="h-40 flex justify-center gap-4 border rounded-lg items-center p-4 hover:bg-accent transition"
                        onClick={createCrateFromFolder}
                    >
                        <FolderOpen className="text-muted-foreground w-12 h-12 m-4 shrink-0" />
                        <div className="flex flex-col gap-4 grow">
                            <div className="text-lg font-bold">Start describing</div>
                            <div className="text-muted-foreground">
                                Open a local folder and start adding metadata to your files.
                            </div>
                        </div>
                    </button>
                    <button
                        className="h-40 flex justify-center gap-4 border rounded-lg items-center p-4 hover:bg-accent transition"
                        onClick={createEmptyCrate}
                    >
                        <Loader className="text-muted-foreground w-12 h-12 m-4 shrink-0" />
                        <div className="flex flex-col gap-4 grow">
                            <div className="text-lg font-bold">Start from scratch</div>
                            <div className="text-muted-foreground">
                                Start with an empty crate. You can add files later on.
                            </div>
                        </div>
                    </button>
                </div>

                <div className="flex justify-center p-20">
                    <div className="flex flex-col gap-6 w-[min(90vw,1000px)]">
                        <div className="font-bold text-xl flex items-center">
                            <Clock className="w-6 h-6 mr-3" /> Recent Crates
                        </div>
                        <div className="grid grid-cols-[20px_4fr_2fr_120px] gap-4 w-full">
                            {!recentCrates ? (
                                [0, 0, 0].map((_, i) => {
                                    return (
                                        <>
                                            <Skeleton key={i + "a"} className="w-4 h-4" />

                                            <Skeleton key={i + "b"} className="w-full h-8" />

                                            <Skeleton key={i + "c"} className="w-full h-8" />

                                            <Skeleton key={i + "d"} className="w-full h-8" />
                                        </>
                                    )
                                })
                            ) : recentCrates.length === 0 ? (
                                <>
                                    <div />
                                    <div className="col-span-3">
                                        Your recently used crates will be shown here once you start
                                        working on a crate.
                                    </div>
                                </>
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
                        </div>
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

                <div className="flex justify-center p-20 pt-0">
                    <div className="flex flex-col gap-6 w-[min(90vw,1000px)]">
                        <div className="font-bold text-xl flex items-center">
                            <HardDrive className="w-6 h-6 mr-3" /> Stored Crates
                        </div>
                        <Error
                            title="An Error occured while fetching stored crates"
                            error={storedCratesError}
                        />
                        <div className="grid grid-cols-[20px_4fr_2fr_120px] gap-4 w-full">
                            {!storedCrates ? (
                                [0, 0, 0].map((_, i) => {
                                    return (
                                        <>
                                            <Skeleton key={i + "a"} className="w-4 h-4" />

                                            <Skeleton key={i + "b"} className="w-full h-8" />

                                            <Skeleton key={i + "c"} className="w-full h-8" />

                                            <Skeleton key={i + "d"} className="w-full h-8" />
                                        </>
                                    )
                                })
                            ) : storedCrates.length === 0 ? (
                                <>
                                    <div />
                                    <div className="col-span-3">
                                        Your local crates will be shown here once you start working
                                        on a crate.
                                    </div>
                                </>
                            ) : (
                                storedCrates.slice(0, showStoredCratesAmount).map((recentCrate) => {
                                    return (
                                        <CrateEntry
                                            key={recentCrate}
                                            crateId={recentCrate}
                                            openEditor={openEditor}
                                            removeFromRecentCrates={removeFromRecentCrates}
                                            isRecentCrate={storedCrates.includes(recentCrate)}
                                            deleteCrate={showDeleteCrateModal}
                                        />
                                    )
                                })
                            )}
                        </div>
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
            </div>
        </div>
    )
}
