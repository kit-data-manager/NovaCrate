"use client"

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
import { ComponentProps, PropsWithChildren, useCallback, useContext, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { useEditorState } from "@/lib/state/editor-state"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

function NavSidebarButton({
    children,
    isActive,
    ...props
}: PropsWithChildren<{ isActive: boolean } & ComponentProps<typeof Button>>) {
    return (
        <Button
            variant="ghost"
            className={`justify-center transition aspect-square h-auto hover:bg-background! ${isActive && "bg-background"}`}
            {...props}
        >
            {children}
        </Button>
    )
}

function NavSidebarLink({
    children,
    page,
    name
}: PropsWithChildren<{ page: string; name: string }>) {
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
        <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
                <Link href={href} title={name}>
                    <NavSidebarButton isActive={isActive}>{children}</NavSidebarButton>
                </Link>
            </TooltipTrigger>
            <TooltipContent side={"right"}>{name}</TooltipContent>
        </Tooltip>
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
                    <NavSidebarLink page="entities" name={"Entity Editor"}>
                        <PackageSearch className="size-5" />
                    </NavSidebarLink>
                    <NavSidebarLink page="file-explorer" name={"File Explorer"}>
                        <Folder className="size-5" />
                    </NavSidebarLink>
                    <NavSidebarLink page="graph" name={"Entity Graph"}>
                        <GitFork className="size-5" />
                    </NavSidebarLink>
                    <NavSidebarLink page="json-editor" name={"JSON Editor"}>
                        <Braces className="size-5" />
                    </NavSidebarLink>
                    <NavSidebarLink page="context" name={"Context"}>
                        <Library className="size-5" />
                    </NavSidebarLink>

                    <div className="grow"></div>

                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <NavSidebarButton
                                isActive={showValidationDrawer}
                                onClick={toggleShowValidationDrawer}
                            >
                                <Bug className="size-4" />
                            </NavSidebarButton>
                        </TooltipTrigger>
                        <TooltipContent side={"right"}>Validation Drawer</TooltipContent>
                    </Tooltip>

                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <Link href={"https://github.com/kit-data-manager/NovaCrate/issues"}>
                                <NavSidebarButton isActive={false}>
                                    <MessageSquare className="size-4" />
                                </NavSidebarButton>
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side={"right"}>Send Feedback</TooltipContent>
                    </Tooltip>

                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <NavSidebarButton isActive={false} onClick={showDocumentationModal}>
                                <BookOpenText className="size-4" />
                            </NavSidebarButton>
                        </TooltipTrigger>
                        <TooltipContent side={"right"}>Documentation</TooltipContent>
                    </Tooltip>
                </div>
            </div>

            <div className="relative w-full h-full overflow-hidden pb-2 pr-3">{children}</div>
        </div>
    )
}
