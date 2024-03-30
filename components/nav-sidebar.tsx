"use client"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { BookOpenText, Bug, Folder, GitFork, Library, PackageSearch } from "lucide-react"
import { PropsWithChildren, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

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
    return (
        <ResizablePanelGroup direction="horizontal" autoSaveId="globalSidebarLayout">
            <ResizablePanel minSize={10} defaultSize={10}>
                <div className="flex flex-col gap-2 p-2 h-full min-w-40 pb-4">
                    <NavSidebarLink page="entities">
                        <PackageSearch className="h-4 w-4 mr-2" />
                        Entities
                    </NavSidebarLink>
                    <NavSidebarLink page="fileExplorer">
                        <Folder className="h-4 w-4 mr-2" />
                        File Explorer
                    </NavSidebarLink>
                    <NavSidebarLink page="graph">
                        <GitFork className="h-4 w-4 mr-2" />
                        Graph
                    </NavSidebarLink>
                    <NavSidebarLink page="graph">
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
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel minSize={50} defaultSize={90}>
                {children}
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}
