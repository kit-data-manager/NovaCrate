"use client"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { EntityBrowser } from "@/components/entity-browser/entity-browser"
import { EntityEditorTabs } from "@/components/editor/entity-editor-tabs"
import { createRef, PropsWithChildren, useCallback, useState } from "react"
import { ImperativePanelHandle } from "react-resizable-panels"
import { Metadata } from "@/components/Metadata"
import { createEntityEditorTab, useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"
import { BaseViewer } from "@/components/file-explorer/viewers/base"
import { IFilePreviewTab } from "@/lib/state/file-explorer-state"
import { makeFilePreviewTab } from "@/components/file-explorer/utils"
import { CrosshairIcon, FileIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useGoToFileExplorer } from "@/lib/hooks/hooks"
import { useEditorState } from "@/lib/state/editor-state"
import { findEntity } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

function EntityEditorFilePreview(props: PropsWithChildren) {
    const previewingFilePath = useEntityEditorTabs((store) => store.previewingFilePath)
    const setPreviewingFilePath = useEntityEditorTabs((store) => store.setPreviewingFilePath)
    const entities = useEditorState((s) => s.entities)
    const goToFileExplorer = useGoToFileExplorer(findEntity(entities, previewingFilePath))
    const openTab = useEntityEditorTabs((store) => store.openTab)

    const focusEntity = useCallback(() => {
        const entity = findEntity(entities, previewingFilePath)
        if (!entity) return

        openTab(createEntityEditorTab(entity), true)
    }, [entities, openTab, previewingFilePath])

    const [previewTab, setPreviewTab] = useState<IFilePreviewTab>(
        makeFilePreviewTab(previewingFilePath)
    )

    if (previewTab.filePath !== previewingFilePath) {
        setPreviewTab(makeFilePreviewTab(previewingFilePath))
    }

    return (
        <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={66} minSize={20}>
                <div className="h-full w-full overflow-auto">{props.children}</div>
            </ResizablePanel>
            <ResizableHandle className="m-0.5" />
            <ResizablePanel defaultSize={34} minSize={20}>
                <div className="flex flex-col h-full w-full overflow-auto border rounded-lg">
                    <div className="flex gap-2 p-2 items-center border-b border-t overflow-x-auto shrink-0 bg-accent no-scrollbar h-10">
                        <FileIcon className="size-4" />
                        <div className="truncate">{previewTab.fileName}</div>
                        <div className="grow" />
                        <Tooltip delayDuration={500}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => focusEntity()}
                                    aria-label={"Focus Entity"}
                                >
                                    <CrosshairIcon className="size-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Focus Entity</TooltipContent>
                        </Tooltip>
                        <Tooltip delayDuration={500}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => goToFileExplorer()}
                                    aria-label={"Open in File Explorer"}
                                >
                                    <FileIcon className="size-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Open in File Explorer</TooltipContent>
                        </Tooltip>
                        <Tooltip delayDuration={500}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPreviewingFilePath("")}
                                    aria-label={"Close File Preview"}
                                >
                                    <XIcon className="size-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Close File Preview</TooltipContent>
                        </Tooltip>
                    </div>
                    <BaseViewer tab={previewTab} updateTab={setPreviewTab} />
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}

export default function Entities() {
    const entityBrowserPanel = createRef<ImperativePanelHandle>()
    const previewingFilePath = useEntityEditorTabs((store) => store.previewingFilePath)

    const toggleEntityBrowserPanel = useCallback(() => {
        if (entityBrowserPanel.current) {
            if (entityBrowserPanel.current.isExpanded()) {
                entityBrowserPanel.current.collapse()
            } else {
                entityBrowserPanel.current.expand()
            }
        }
    }, [entityBrowserPanel])

    return (
        <>
            <Metadata page={"Entities"} />
            <ResizablePanelGroup direction={"horizontal"}>
                <ResizablePanel
                    defaultSize={30}
                    minSize={10}
                    ref={entityBrowserPanel}
                    collapsible
                    collapsedSize={0}
                >
                    <div className="h-full w-full overflow-auto">
                        <EntityBrowser />
                    </div>
                </ResizablePanel>
                <ResizableHandle className="m-0.5" />
                <ResizablePanel defaultSize={70} minSize={30}>
                    {previewingFilePath ? (
                        <EntityEditorFilePreview>
                            <EntityEditorTabs toggleEntityBrowserPanel={toggleEntityBrowserPanel} />
                        </EntityEditorFilePreview>
                    ) : (
                        <EntityEditorTabs toggleEntityBrowserPanel={toggleEntityBrowserPanel} />
                    )}
                </ResizablePanel>
            </ResizablePanelGroup>
        </>
    )
}
