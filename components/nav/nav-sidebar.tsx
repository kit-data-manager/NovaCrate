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
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { useEditorState } from "@/lib/state/editor-state"
import { Footer } from "@/components/footer"

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
                variant="ghost"
                className={`justify-center transition aspect-square h-auto ${isActive && "bg-accent"}`}
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
        <div className="grid grid-cols-[58px_auto] h-full">
            <div className="relative h-full flex flex-col">
                <div className="flex flex-col gap-2 p-2 pb-4 pt-0 grow">
                    <NavSidebarLink page="entities">
                        <PackageSearch className="size-5" />
                    </NavSidebarLink>
                    <NavSidebarLink page="file-explorer">
                        <Folder className="size-5" />
                    </NavSidebarLink>
                    <NavSidebarLink page="graph">
                        <GitFork className="size-5" />
                    </NavSidebarLink>
                    <NavSidebarLink page="json-editor">
                        <Braces className="size-5" />
                    </NavSidebarLink>
                    <NavSidebarLink page="context">
                        <Library className="size-5" />
                    </NavSidebarLink>

                    <div className="grow"></div>

                    <Button
                        variant="link"
                        className={`justify-start w-full ${showValidationDrawer && "bg-accent"}`}
                        onClick={toggleShowValidationDrawer}
                    >
                        <Bug className="size-4 mr-2" />
                    </Button>

                    <Link href={"https://github.com/kit-data-manager/NovaCrate/issues"}>
                        <Button variant="link" className={`justify-start w-full`}>
                            <MessageSquare className="size-4 mr-2" />
                        </Button>
                    </Link>

                    <Button
                        variant="link"
                        className={`justify-start w-full`}
                        onClick={showDocumentationModal}
                    >
                        <BookOpenText className="size-4 mr-2" />
                    </Button>
                </div>
            </div>

            <div className="relative w-full h-full overflow-hidden pb-2 pr-2">{children}</div>
        </div>
    )
}
