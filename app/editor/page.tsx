"use client"

import {
    BookOpen,
    ChevronDown,
    CirclePlay,
    Clock,
    FolderOpen,
    HardDrive,
    Loader,
    LoaderCircle,
    Moon,
    Package,
    PackageOpen,
    PackagePlus,
    Search,
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
import { Fragment, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CrateEntry } from "@/components/landing/crate-entry"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { useAsync, useDemoCrateLoader, useRecentCrates } from "@/lib/hooks"
import { DeleteCrateModal } from "@/components/landing/delete-crate-modal"
import { CreateCrateModal } from "@/components/landing/create-crate-modal"
import { Error } from "@/components/error"
import { Pagination } from "@/components/pagination"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

export default function EditorLandingPage() {
    const router = useRouter()
    const theme = useTheme()
    const { recentCrates, removeFromRecentCrates } = useRecentCrates()
    const [fadeOutAnimation, setFadeOutAnimation] = useState(false)
    const {
        serviceProvider,
        setCrateId,
        unsetCrateId,
        healthTestError: error
    } = useContext(CrateDataContext)
    const { openFilePicker: openZipFilePicker, plainFiles: zipFiles } = useFilePicker({
        accept: ".zip"
    })
    const { showDocumentationModal } = useContext(GlobalModalContext)
    const demoLoader = useDemoCrateLoader()
    const [demoLoaderError, setDemoLoaderError] = useState<unknown>()
    const [demoLoading, setDemoLoading] = useState(false)

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
        fromZip: undefined as File | undefined
    })
    const [search, setSearch] = useState("")

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
            fromFolder: false,
            fromZip: undefined,
            open: true
        })
    }, [])

    const createCrateFromFolder = useCallback(() => {
        setCreateCrateModalState({
            fromFolder: true,
            fromZip: undefined,
            open: true
        })
    }, [])

    const createCrateFromExample = useCallback(
        async (name: string) => {
            try {
                setDemoLoading(true)
                const data = await demoLoader(name)
                if (data === null) {
                    setDemoLoaderError("Failed to load demo crate")
                    setDemoLoading(false)
                } else {
                    if (!serviceProvider) {
                        setDemoLoading(false)
                        return setDemoLoaderError("Crate service not ready")
                    }
                    const id = await serviceProvider?.createCrateFromCrateZip(data)
                    setDemoLoaderError(undefined)

                    setFadeOutAnimation(true)
                    router.prefetch(`/editor/full/entities`)
                    setTimeout(() => {
                        if (id !== "undefined") {
                            setCrateId(id)
                            router.push(`/editor/full/entities`)
                        } else {
                            setDemoLoading(false)
                            setDemoLoaderError("Failed to load demo crate")
                        }
                    }, 500)
                }
            } catch (e) {
                setDemoLoaderError(e)
            }
        },
        [demoLoader, router, serviceProvider, setCrateId]
    )

    useEffect(() => {
        if (zipFiles.length > 0) {
            setCreateCrateModalState({
                fromFolder: false,
                fromZip: zipFiles[0],
                open: true
            })
        }
    }, [zipFiles])

    const openEditor = useCallback(
        (id: string) => {
            if (fadeOutAnimation) return
            setFadeOutAnimation(true)
            onCreateCrateModalOpenChange(false)
            router.prefetch(`/editor/full/entities`)
            setTimeout(() => {
                if (id !== "undefined") {
                    setCrateId(id)
                    router.push(`/editor/full/entities`)
                }
            }, 500)
        },
        [fadeOutAnimation, onCreateCrateModalOpenChange, router, setCrateId]
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

    const searchInfo = useMemo(() => {
        return search ? (
            <div className="text-sm text-muted-foreground">
                Showing search results for &quot;{search}&quot;
                <button
                    onClick={() => setSearch("")}
                    className="hover:underline underline-offset-4 ml-4"
                >
                    Clear
                </button>
            </div>
        ) : null
    }, [search])

    return (
        <div className="w-full h-full grid grid-cols-[1fr_2fr]">
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

            <div
                className={`bg-accent h-full flex flex-col ${fadeOutAnimation ? "animate-slide-left translate-x-[-100%]" : "animate-slide-left-reverse"}`}
            >
                <div className="flex flex-col items-center justify-center h-[max(45vh,200px)] p-10">
                    <Package className="w-32 h-32 mb-10" />
                    <h2 className="text-5xl font-bold">NovaCrate</h2>
                    <h4>RO-Crate Editor</h4>
                </div>

                <div className="flex flex-col items-center pr-20">
                    <div className="flex items-start flex-col">
                        <Button
                            size="lg"
                            variant="link"
                            className="border-r-0 rounded-r-none h-12"
                            onClick={() => openZipFilePicker()}
                        >
                            <PackageOpen className="w-6 h-6 mr-3" /> Import existing Crate
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    size="lg"
                                    variant="link"
                                    className="rounded-none border-r-0 h-12"
                                >
                                    <PackagePlus className="w-6 h-6 mr-3" /> New Crate{" "}
                                    <ChevronDown className="size-4 ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={createCrateFromFolder}>
                                    <FolderOpen className="size-4 mr-2" /> Start with Data
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={createEmptyCrate}>
                                    <Loader className="size-4 mr-2" />
                                    Start from scratch
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            size="lg"
                            variant="link"
                            className="rounded-none border-r-0 h-12"
                            onClick={showDocumentationModal}
                        >
                            <BookOpen className="w-6 h-6 mr-3" /> Documentation
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

            <div
                className={`h-full overflow-y-auto ${fadeOutAnimation ? "animate-fade-out opacity-0" : "animate-fade-in"}`}
            >
                <div className="grid grid-cols-2 p-20 pb-0 gap-8 max-w-[1000px] ml-auto mr-auto">
                    <button
                        className="h-40 flex justify-center gap-4 border rounded-lg items-center p-4 hover:bg-accent transition"
                        onClick={createCrateFromFolder}
                    >
                        <FolderOpen className="text-muted-foreground w-12 h-12 m-4 shrink-0" />
                        <div className="flex flex-col gap-4 grow">
                            <div className="text-lg font-bold">Start with data</div>
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

                    <div
                        className={`max-w-[1000px] ml-auto mr-auto border flex col-span-2 w-full rounded-lg p-4 items-center`}
                    >
                        <CirclePlay className="size-4 mr-2" />
                        <div className="font-bold mr-2">Quickstart</div>
                        <div>Try out NovaCrate with one of these demo crates</div>
                        <div className="grow" />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" disabled={demoLoading}>
                                    {demoLoading && (
                                        <LoaderCircle className="animate-spin mr-2 size-4" />
                                    )}{" "}
                                    Quickstart <ChevronDown className="size-4 ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem
                                    onClick={() => createCrateFromExample("ro-crate-spec")}
                                >
                                    <CirclePlay className="size-4 mr-2" />
                                    RO-Crate Specification Crate
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <Error
                    title="Demo could not be started"
                    error={demoLoaderError}
                    className="m-20 mb-0"
                />
                <Error title="Crate service is not reachable" error={error} className="m-20 mb-0" />

                <div className="pt-16">
                    <Tabs defaultValue="recent">
                        <div className="flex justify-center pb-4 gap-4">
                            <TabsList>
                                <TabsTrigger value={"recent"}>
                                    <Clock className="size-4 mr-2" /> Recent Crates
                                </TabsTrigger>
                                <TabsTrigger value={"stored"}>
                                    <HardDrive className="size-4 mr-2" /> All Crates
                                </TabsTrigger>
                            </TabsList>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="secondary" size="icon">
                                        <Search className="size-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="grid grid-cols-1 gap-2">
                                    {" "}
                                    <h4 className="font-medium leading-none">Search for Crates</h4>
                                    <Input
                                        placeholder="Search..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <TabsContent value={"recent"}>
                            <div className="flex justify-center p-20 pt-0">
                                <div className="flex flex-col gap-2 w-[min(90vw,1000px)]">
                                    <div className="grid grid-cols-[20px_4fr_2fr_120px] gap-4 w-full pl-2">
                                        <Clock className="w-6 h-6 mr-3" />
                                        <div className="font-semibold text-xl flex items-center">
                                            Recent Crates
                                        </div>
                                        <div className="flex flex-col items-center text-muted-foreground text-sm justify-center">
                                            Last Opened
                                        </div>
                                        <div className="flex flex-col items-center text-muted-foreground text-sm justify-center">
                                            Actions
                                        </div>
                                    </div>
                                    {searchInfo}
                                    <Pagination pageSize={10}>
                                        {!recentCrates ? (
                                            <div>
                                                {[0, 0, 0].map((_, i) => {
                                                    return (
                                                        <div key={i}>
                                                            <Skeleton className="w-full h-8 mb-2" />
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ) : recentCrates.length === 0 ? (
                                            <>
                                                <div />
                                                <div className="col-span-3">
                                                    Your recently used crates will be shown here
                                                    once you start working on a crate.
                                                </div>
                                            </>
                                        ) : (
                                            recentCrates.map((recentCrate) => {
                                                return (
                                                    <CrateEntry
                                                        key={recentCrate}
                                                        crateId={recentCrate}
                                                        openEditor={openEditor}
                                                        removeFromRecentCrates={
                                                            removeFromRecentCrates
                                                        }
                                                        isRecentCrate={recentCrates.includes(
                                                            recentCrate
                                                        )}
                                                        deleteCrate={showDeleteCrateModal}
                                                        search={search}
                                                    />
                                                )
                                            })
                                        )}
                                    </Pagination>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value={"stored"}>
                            <div className="flex justify-center p-20 pt-0">
                                <div className="flex flex-col gap-2 w-[min(90vw,1000px)]">
                                    <Error
                                        title="An Error occured while fetching stored crates"
                                        error={storedCratesError}
                                    />
                                    <div className="grid grid-cols-[20px_4fr_2fr_120px] gap-4 w-full pl-2">
                                        <HardDrive className="w-6 h-6 mr-3" />
                                        <div className="font-semibold text-xl flex items-center">
                                            All Crates
                                        </div>
                                        <div className="flex flex-col items-center text-muted-foreground text-sm justify-center">
                                            Last Opened
                                        </div>
                                        <div className="flex flex-col items-center text-muted-foreground text-sm justify-center">
                                            Actions
                                        </div>
                                    </div>
                                    {searchInfo}
                                    <Pagination pageSize={10}>
                                        {!storedCrates ? (
                                            [0, 0, 0].map((_, i) => {
                                                return (
                                                    <Fragment key={i}>
                                                        <Skeleton className="size-4" />
                                                        <Skeleton className="w-full h-8" />
                                                        <Skeleton className="w-full h-8" />
                                                        <Skeleton className="w-full h-8" />
                                                    </Fragment>
                                                )
                                            })
                                        ) : storedCrates.length === 0 ? (
                                            <>
                                                <div />
                                                <div className="col-span-3">
                                                    Your local crates will be shown here once you
                                                    start working on a crate.
                                                </div>
                                            </>
                                        ) : (
                                            storedCrates.map((recentCrate) => {
                                                return (
                                                    <CrateEntry
                                                        key={recentCrate}
                                                        crateId={recentCrate}
                                                        openEditor={openEditor}
                                                        removeFromRecentCrates={
                                                            removeFromRecentCrates
                                                        }
                                                        isRecentCrate={recentCrates?.includes(
                                                            recentCrate
                                                        )}
                                                        deleteCrate={showDeleteCrateModal}
                                                        search={search}
                                                    />
                                                )
                                            })
                                        )}
                                    </Pagination>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
