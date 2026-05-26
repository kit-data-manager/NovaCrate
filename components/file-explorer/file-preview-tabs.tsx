"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { FileIcon, XIcon } from "lucide-react"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger
} from "@/components/ui/context-menu"
import { IFilePreviewTab, useFileExplorerState } from "@/lib/state/file-explorer-state"

function FilePreviewTab({ tab, active }: { tab: IFilePreviewTab; active: boolean }) {
    const focusTab = useFileExplorerState((store) => store.focusTab)
    const closeTab = useFileExplorerState((store) => store.closeTab)
    const closeAllTabs = useFileExplorerState((store) => store.closeAllTabs)
    const closeOtherTabs = useFileExplorerState((store) => store.closeOtherTabs)

    const button = useRef<HTMLButtonElement>(null)

    const focus = useCallback(() => {
        focusTab(tab.filePath)
    }, [focusTab, tab.filePath])

    const close = useCallback(() => {
        closeTab(tab.filePath)
    }, [closeTab, tab.filePath])

    const closeOthers = useCallback(() => {
        closeOtherTabs(tab.filePath)
    }, [closeOtherTabs, tab.filePath])

    useEffect(() => {
        if (button.current && active) {
            button.current.scrollIntoView()
        }
    })

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <Button
                    onClick={focus}
                    variant="tab"
                    data-active={active}
                    className={`cursor-default px-1.5 gap-1 group transition-colors`}
                    ref={button}
                >
                    <FileIcon className="size-4" />
                    <div className={`transition-colors max-w-75 truncate`}>{tab.fileName}</div>
                    <div
                        onClick={(e) => {
                            e.stopPropagation()
                            close()
                        }}
                        className={`shrink-0 hover:bg-background p-1 text-xs rounded cursor-pointer ${active ? "" : "opacity-0 group-hover:opacity-100"}`}
                    >
                        <XIcon className="size-3" />
                    </div>
                </Button>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={close}>
                    <XIcon className="size-4 mr-2" /> Close Tab
                </ContextMenuItem>
                <ContextMenuItem onClick={closeAllTabs}>
                    <XIcon className="size-4 mr-2" /> Close All
                </ContextMenuItem>
                <ContextMenuItem onClick={closeOthers}>
                    <XIcon className="size-4 mr-2" /> Close Others
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}

function FilePreviewTabsList({
    tabs,
    currentTab
}: {
    tabs: IFilePreviewTab[]
    currentTab?: IFilePreviewTab
}) {
    const container = useRef<HTMLDivElement>(null)

    return (
        <div
            ref={container}
            className="flex overflow-x-auto shrink-0 no-scrollbar h-10 p-1 gap-2 bg-accent"
            onWheel={(s) => {
                if (s.deltaY !== 0 && container.current) {
                    // noinspection JSSuspiciousNameCombination
                    container.current.scrollBy({
                        left: s.deltaY,
                        top: 0,
                        behavior: "auto"
                    })
                }
            }}
        >
            {tabs.map((tab) => {
                return (
                    <FilePreviewTab
                        key={tab.filePath}
                        active={currentTab?.filePath === tab.filePath}
                        tab={tab}
                    />
                )
            })}
        </div>
    )
}

export function FilePreviewTabs() {
    const filePreviewTabs = useFileExplorerState((s) => s.filePreviewTabs)
    const activeFilePreviewTabPath = useFileExplorerState((s) => s.activeFilePreviewTabPath)

    const activeTab = useMemo(() => {
        return filePreviewTabs.find((tab) => tab.filePath === activeFilePreviewTabPath)
    }, [activeFilePreviewTabPath, filePreviewTabs])

    return (
        <div className="bg-background h-full flex flex-col overflow-hidden rounded-lg border">
            <FilePreviewTabsList tabs={filePreviewTabs} currentTab={activeTab} />
        </div>
    )
}
