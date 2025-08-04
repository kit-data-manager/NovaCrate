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
    MessageSquare,
    PackageSearch
} from "lucide-react"
import { PropsWithChildren, useCallback, useContext, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import packageJson from "@/package.json"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { useEditorState } from "@/lib/state/editor-state"

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

export function NavSidebar({ children }: PropsWithChildren) {
    const { showDocumentationModal } = useContext(GlobalModalContext)
    const showValidationDrawer = useEditorState((s) => s.showValidationDrawer)
    const setShowValidationDrawer = useEditorState((s) => s.setShowValidationDrawer)

    const toggleShowValidationDrawer = useCallback(() => {
        setShowValidationDrawer(!showValidationDrawer)
    }, [setShowValidationDrawer, showValidationDrawer])

    return (
        <ResizablePanelGroup direction="horizontal" autoSaveId="globalSidebarLayout">
            <ResizablePanel minSize={10} defaultSize={15}>
                <div className="relative h-full flex flex-col">
                    <div className="flex flex-col gap-2 p-2 pt-0 min-w-40 pb-4 grow">
                        <NavSidebarLink page="entities">
                            <PackageSearch className="size-4 mr-2" />
                            Entities
                        </NavSidebarLink>
                        <NavSidebarLink page="file-explorer">
                            <Folder className="size-4 mr-2" />
                            File Explorer
                        </NavSidebarLink>
                        <NavSidebarLink page="graph">
                            <GitFork className="size-4 mr-2" />
                            Graph
                        </NavSidebarLink>
                        <NavSidebarLink page="json-editor">
                            <Braces className="size-4 mr-2" />
                            JSON Editor
                        </NavSidebarLink>
                        <NavSidebarLink page="context">
                            <Library className="size-4 mr-2" />
                            Context
                        </NavSidebarLink>

                        <div className="grow"></div>

                        <Button
                            variant="link"
                            className={`justify-start w-full ${showValidationDrawer && "bg-accent"}`}
                            onClick={toggleShowValidationDrawer}
                        >
                            <Bug className="size-4 mr-2" />
                            Validation
                        </Button>

                        <Link href={"https://github.com/kit-data-manager/NovaCrate/issues"}>
                            <Button variant="link" className={`justify-start w-full`}>
                                <MessageSquare className="size-4 mr-2" />
                                Send Feedback
                            </Button>
                        </Link>

                        <Button
                            variant="link"
                            className={`justify-start w-full`}
                            onClick={showDocumentationModal}
                        >
                            <BookOpenText className="size-4 mr-2" />
                            Documentation
                        </Button>

                        <div className="text-center text-sm text-muted-foreground">
                            {packageJson.name} v{packageJson.version}
                        </div>
                    </div>
                </div>
            </ResizablePanel>
            <ResizableHandle className="bg-transparent" />
            <ResizablePanel minSize={50} defaultSize={85}>
                <div className="relative w-full h-full rounded-tl-lg overflow-hidden border-l border-t">
                    {children}
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}
