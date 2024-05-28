"use client"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { Braces, Bug, Folder, GitFork, Library, PackageSearch } from "lucide-react"
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
                <div className="relative h-full flex flex-col">
                    <div className="flex flex-col gap-2 p-2 pt-0 min-w-40 pb-4 grow">
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

                        {/*<Button variant="link" className={`justify-start w-full`}>*/}
                        {/*    <BookOpenText className="h-4 w-4 mr-2" />*/}
                        {/*    Help*/}
                        {/*</Button>*/}
                    </div>
                </div>
            </ResizablePanel>
            <ResizableHandle className="bg-transparent" />
            <ResizablePanel minSize={50} defaultSize={90}>
                <div className="relative w-full h-full rounded-tl-lg overflow-hidden border-l border-t">
                    {children}
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}
