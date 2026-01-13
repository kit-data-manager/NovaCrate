"use client"

import {
    ChevronDown,
    CirclePlay,
    Clock,
    HardDrive,
    Info,
    LinkIcon,
    LoaderCircle,
    PackageOpen,
    PackagePlus,
    Palette,
    Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CrateEntry } from "@/components/landing/crate-entry"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { useDemoCrateLoader, useRecentCrates } from "@/lib/hooks"
import { DeleteCrateModal } from "@/components/landing/delete-crate-modal"
import { CreateCrateModal } from "@/components/landing/create-crate-modal"
import { Error } from "@/components/error"
import { Pagination } from "@/components/pagination"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import useSWR from "swr"
import { Footer } from "@/components/footer"
import { GithubDiscontinuationWarning } from "@/components/github-discontinuation-warning"
import Image from "next/image"

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
    const createUploadInputRef = useRef<HTMLInputElement>(null)
    const { showAboutModal } = useContext(GlobalModalContext)
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
        fromFile: undefined as File | undefined
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
            fromFile: undefined,
            open: true
        })
    }, [])

    const createCrateFromFolder = useCallback(() => {
        setCreateCrateModalState({
            fromFolder: true,
            fromFile: undefined,
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

    const createUploadInputChangeHandler = useCallback(() => {
        if (
            createUploadInputRef.current &&
            createUploadInputRef.current.files &&
            createUploadInputRef.current.files.length > 0
        ) {
            setCreateCrateModalState({
                fromFolder: false,
                fromFile: createUploadInputRef.current.files[0],
                open: true
            })
        }
    }, [])

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
        mutate: revalidate
    } = useSWR("stored-crates", storedCratesResolver, { dedupingInterval: 500 })

    const openZipFilePicker = useCallback(() => {
        createUploadInputRef.current?.click()
    }, [])

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
        <div className="w-full h-full grid md:grid-cols-[1fr_2fr]">
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

            <div className="md:p-20 md:pr-0">
                <div
                    className={`bg-accent h-full flex flex-col ${fadeOutAnimation ? "animate-fade-out opacity-0" : "animate-fade-in"} rounded-lg overflow-hidden border grid grid-rows-[1fr_auto_1fr]`}
                >
                    <div />
                    <div className="flex flex-col items-center justify-center p-10">
                        <Image
                            src={"/novacrate-nobg.svg"}
                            alt={"NovaCrate Logo"}
                            width={600}
                            height={195}
                            className="dark:invert"
                        />
                        <GithubDiscontinuationWarning className="mt-10" />
                    </div>

                    <div className="content-end">
                        <div className="flex justify-center items-center gap-2 pb-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <Palette className="size-4" /> Theme
                                        <ChevronDown className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    {theme.systemTheme && (
                                        <DropdownMenuCheckboxItem
                                            checked={theme.theme === "system"}
                                            onClick={() => theme.setTheme("system")}
                                        >
                                            System Default ({theme.systemTheme})
                                        </DropdownMenuCheckboxItem>
                                    )}
                                    <DropdownMenuCheckboxItem
                                        checked={theme.theme === "dark"}
                                        onClick={() => theme.setTheme("dark")}
                                    >
                                        Dark Theme
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={theme.theme === "light"}
                                        onClick={() => theme.setTheme("light")}
                                    >
                                        Light Theme
                                    </DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button variant="outline" onClick={showAboutModal}>
                                <Info /> About
                            </Button>
                        </div>
                        <Footer />
                    </div>
                </div>
            </div>

            <div
                className={`overflow-y-auto ${fadeOutAnimation ? "animate-fade-out opacity-0" : "animate-fade-in"} pt-2 md:p-20 md:pl-2 flex flex-col`}
            >
                <div className="p-4 border rounded-lg flex gap-2 mb-2">
                    <Button onClick={openZipFilePicker}>
                        <PackageOpen className="size-4" />
                        Import RO-Crate
                    </Button>
                    <Button variant="outline" onClick={createCrateFromFolder}>
                        <PackagePlus className="size-4" />
                        New RO-Crate
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" disabled={demoLoading}>
                                {demoLoading ? (
                                    <LoaderCircle className="animate-spin size-4" />
                                ) : (
                                    <CirclePlay className="size-4" />
                                )}
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
                            <DropdownMenuItem
                                onClick={() =>
                                    window.open(
                                        "https://www.researchobject.org/ro-crate/eln",
                                        "_blank"
                                    )
                                }
                            >
                                <LinkIcon className="size-4 mr-2" />
                                Download ELNs
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <Error title="Demo could not be started" error={demoLoaderError} className="mb-2" />
                <Error title="Crate service is not reachable" error={error} className="mb-2" />
                <Error
                    title="Crate storage unavailable"
                    error={storedCratesError}
                    className="mb-2"
                />

                <div className="border rounded-lg grow">
                    <Tabs defaultValue="recent" className="h-full">
                        <TabsList className="h-auto rounded-none border-b w-full justify-start bg-transparent p-2">
                            <TabsTrigger value={"recent"}>
                                <Clock className="size-4 mr-2" /> Recent Crates
                            </TabsTrigger>
                            <TabsTrigger value={"stored"}>
                                <HardDrive className="size-4 mr-2" /> All Crates
                            </TabsTrigger>
                            <div className="grow" />
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Search className="size-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="grid grid-cols-1 gap-2">
                                    <h4 className="font-medium leading-none">Search for Crates</h4>
                                    <Input
                                        placeholder="Search..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </PopoverContent>
                            </Popover>
                        </TabsList>

                        <TabsContent value={"recent"}>
                            <div className="flex flex-col gap-2 p-4 h-full">
                                <div className="grid grid-cols-[20px_4fr_2fr_120px] gap-4 w-full pl-2">
                                    <div />
                                    <div className="text-muted-foreground text-xs">Name</div>
                                    <div className="text-muted-foreground text-xs">Last Opened</div>
                                    <div className="text-muted-foreground text-xs">Actions</div>
                                </div>
                                {searchInfo}
                                <Pagination pageSize={15}>
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
                                                Your local crates will be shown here once you start
                                                working on a crate.
                                            </div>
                                        </>
                                    ) : (
                                        recentCrates.map((recentCrate) => {
                                            return (
                                                <CrateEntry
                                                    key={recentCrate}
                                                    crateId={recentCrate}
                                                    openEditor={openEditor}
                                                    removeFromRecentCrates={removeFromRecentCrates}
                                                    isRecentCrate={true}
                                                    deleteCrate={showDeleteCrateModal}
                                                    search={search}
                                                />
                                            )
                                        })
                                    )}
                                </Pagination>
                            </div>
                        </TabsContent>
                        <TabsContent value={"stored"} className="grow">
                            <div className="flex flex-col gap-2 p-4 h-full">
                                <div className="grid grid-cols-[20px_4fr_2fr_120px] gap-4 w-full pl-2">
                                    <div />
                                    <div className="text-muted-foreground text-xs">Name</div>
                                    <div className="text-muted-foreground text-xs">Last Opened</div>
                                    <div className="text-muted-foreground text-xs">Actions</div>
                                </div>
                                {searchInfo}
                                <Pagination pageSize={15}>
                                    {!storedCrates ? (
                                        <div>
                                            {[0, 0, 0].map((_, i) => {
                                                return (
                                                    <div key={i}>
                                                        <Skeleton className="w-full h-8 mb-2" />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : storedCrates.length === 0 ? (
                                        <>
                                            <div />
                                            <div className="col-span-3">
                                                Your local crates will be shown here once you start
                                                working on a crate.
                                            </div>
                                        </>
                                    ) : (
                                        storedCrates.map((recentCrate) => {
                                            return (
                                                <CrateEntry
                                                    key={recentCrate}
                                                    crateId={recentCrate}
                                                    openEditor={openEditor}
                                                    removeFromRecentCrates={removeFromRecentCrates}
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
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            <input
                type="file"
                className="hidden"
                accept=".zip,.eln,.json,.jsonld"
                data-testid="create-upload-input"
                ref={createUploadInputRef}
                onChange={() => createUploadInputChangeHandler()}
            />
        </div>
    )
}
