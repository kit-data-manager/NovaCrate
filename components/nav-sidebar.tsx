"use client"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import {
    BookOpenText,
    Braces,
    Bug,
    Copy,
    EllipsisVertical,
    Folder,
    GitFork,
    Library,
    Package,
    PackageSearch
} from "lucide-react"
import { PropsWithChildren, useCallback, useContext, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CrateDataContext } from "@/components/crate-data-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { isRootEntity } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useCopyToClipboard } from "usehooks-ts"

function NavSidebarLink({ children, page }: PropsWithChildren<{ page: string }>) {
    const pathname = usePathname()

    const isActive = useMemo(() => {
        return pathname.split("/")[3] == page
    }, [page, pathname])

    const href = useMemo(() => {
        return (
            pathname
                .split("/")
                .filter((_, i) => i < 3)
                .join("/") +
            "/" +
            page
        )
    }, [page, pathname])

    return (
        <Link href={href}>
            <Button
                variant="link"
                className={`justify-start w-full bg-background ${isActive ? "bg-accent" : ""} transition`}
            >
                {children}
            </Button>
        </Link>
    )
}

export function NavSidebar({ children }: PropsWithChildren<{}>) {
    const crate = useContext(CrateDataContext)
    const [_, copyFn] = useCopyToClipboard()

    const copy = useCallback(
        (text: string) => {
            copyFn(text).catch((e) => console.error("Failed to copy to clipboard", e))
        },
        [copyFn]
    )

    const crateName = useMemo(() => {
        return (crate.crateData?.["@graph"].find(isRootEntity)?.name || "") + ""
    }, [crate.crateData])

    return (
        <ResizablePanelGroup direction="horizontal" autoSaveId="globalSidebarLayout">
            <ResizablePanel minSize={10} defaultSize={10}>
                <div className="h-full flex flex-col">
                    <div className="pl-4 pr-2 h-10 flex items-center bg-accent shrink-0">
                        {crate.crateDataIsLoading ? (
                            <Skeleton className="h-6 w-full mr-4 bg-muted-foreground/20" />
                        ) : (
                            <div className="text-sm w-full flex items-center">
                                <Package className="w-4 h-4 shrink-0 mr-2" />{" "}
                                <div className="truncate shrink">{crateName || crate.crateId}</div>
                                <div className="grow" />
                                <DropdownMenu>
                                    <DropdownMenuTrigger>
                                        <EllipsisVertical className="w-4 h-4" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => copy(crate.crateId)}>
                                            <Copy className="w-4 h-4 mr-2" /> Copy Crate ID
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => copy(crateName || crate.crateId)}
                                        >
                                            <Copy className="w-4 h-4 mr-2" /> Copy Crate Name
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-2 p-2 min-w-40 pb-4 grow">
                        <NavSidebarLink page="entities">
                            <PackageSearch className="h-4 w-4 mr-2" />
                            Entities
                        </NavSidebarLink>
                        <NavSidebarLink page="file-explorer">
                            <Folder className="h-4 w-4 mr-2" />
                            File Explorer
                        </NavSidebarLink>
                        <NavSidebarLink page="graph">
                            <GitFork className="h-4 w-4 mr-2" />
                            Graph
                        </NavSidebarLink>
                        <NavSidebarLink page="json-editor">
                            <Braces className="h-4 w-4 mr-2" />
                            JSON Editor
                        </NavSidebarLink>
                        <NavSidebarLink page="context">
                            <Library className="h-4 w-4 mr-2" />
                            Context
                        </NavSidebarLink>

                        <div className="grow"></div>

                        <Button variant="link" className={`justify-start w-full`}>
                            <Bug className="h-4 w-4 mr-2" />
                            Validation
                        </Button>

                        <Button variant="link" className={`justify-start w-full`}>
                            <BookOpenText className="h-4 w-4 mr-2" />
                            Help
                        </Button>
                    </div>
                </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel minSize={50} defaultSize={90}>
                {children}
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}
