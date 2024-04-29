"use client"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import {
    BookOpenText,
    Braces,
    Bug,
    Folder,
    GitFork,
    Library,
    PackageSearch,
    ScanBarcode
} from "lucide-react"
import { PropsWithChildren, useContext, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CrateDataContext } from "@/components/crate-data-provider"
import { Skeleton } from "@/components/ui/skeleton"

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

    return (
        <ResizablePanelGroup direction="horizontal" autoSaveId="globalSidebarLayout">
            <ResizablePanel minSize={10} defaultSize={10}>
                <div className="h-full flex flex-col">
                    <div className="px-4 h-10 flex items-center bg-accent shrink-0">
                        {crate.crateDataIsLoading ? (
                            <Skeleton className="h-6 w-full mr-4 bg-muted-foreground/20" />
                        ) : (
                            <div className="text-sm w-full flex items-center">
                                <ScanBarcode className="w-4 h-4 shrink-0 mr-2" />{" "}
                                <div className="truncate shrink">{crate.crateId}</div>
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
