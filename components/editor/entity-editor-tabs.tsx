"use client"

import { useCallback, useContext, useEffect, useMemo, useRef } from "react"
import {
    EntityEditorTabsContext,
    IEntityEditorTab
} from "@/components/providers/entity-tabs-provider"
import { Diff, getEntityDisplayName } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Package, Plus, XIcon } from "lucide-react"
import { EntityIcon } from "@/components/entity-icon"
import { EntityEditor } from "@/components/editor/entity-editor"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { useEditorState } from "@/lib/state/editor-state"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger
} from "@/components/ui/context-menu"
import { CrateDataContext } from "@/components/providers/crate-data-provider"
import { Skeleton } from "@/components/ui/skeleton"

function Tab({
    tab,
    active,
    entitiesChangelist
}: {
    tab: IEntityEditorTab
    active: boolean
    entitiesChangelist: Map<string, Diff>
}) {
    const entity = useEditorState((store) => store.entities.get(tab.entityId))
    const entitiesSize = useEditorState((store) => store.entities.size)
    const { focusTab, closeTab, closeOtherTabs, closeAllTabs } = useContext(EntityEditorTabsContext)
    const { showSaveEntityChangesModal } = useContext(GlobalModalContext)
    const { crateDataIsLoading } = useContext(CrateDataContext)

    const button = useRef<HTMLButtonElement>(null)

    const focus = useCallback(() => {
        focusTab(tab.entityId)
    }, [focusTab, tab.entityId])

    const dirty = useMemo(() => {
        const diff = entitiesChangelist.get(tab.entityId)
        return !!diff
    }, [entitiesChangelist, tab.entityId])

    const close = useCallback(() => {
        if (dirty) {
            showSaveEntityChangesModal(tab.entityId)
        } else {
            closeTab(tab.entityId)
        }
    }, [dirty, showSaveEntityChangesModal, tab.entityId, closeTab])

    useEffect(() => {
        if (button.current && active) {
            button.current.scrollIntoView()
        }
    })

    useEffect(() => {
        if (!entity && !crateDataIsLoading && entitiesSize > 0) {
            console.warn("Closed a tab because the entity could not be found. ", tab)
            close()
        }
    }, [close, crateDataIsLoading, entitiesSize, entity, tab])

    if (!entity)
        return (
            <Button
                variant="tab"
                data-active={active}
                className={`cursor-default ${active ? "pr-1" : ""}`}
                ref={button}
            >
                <Skeleton className="mr-2 h-6 w-6 bg-muted-foreground/30" />
                <Skeleton className="h-6 w-32 bg-muted-foreground/30 mr-2" />
                <div
                    onClick={(e) => {
                        e.stopPropagation()
                        close()
                    }}
                    className="ml-2 shrink-0 hover:bg-background p-1 text-xs rounded transition cursor-pointer"
                >
                    <XIcon className="w-4 h-4" />
                </div>
            </Button>
        )

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <Button
                    onClick={focus}
                    variant="tab"
                    data-active={active}
                    className={`cursor-default ${active ? "pr-1" : ""}`}
                    ref={button}
                >
                    <EntityIcon entity={entity} />
                    <div className={`ml-1 transition-colors max-w-[300px] truncate`}>
                        {getEntityDisplayName(entity)}
                        {dirty ? <b>*</b> : null}
                    </div>
                    {active ? (
                        <div
                            onClick={(e) => {
                                e.stopPropagation()
                                close()
                            }}
                            className="ml-2 shrink-0 hover:bg-background p-1 text-xs rounded transition cursor-pointer"
                        >
                            <XIcon className="w-4 h-4" />
                        </div>
                    ) : null}
                </Button>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={close}>
                    <XIcon className="w-4 h-4 mr-2" /> Close Tab
                </ContextMenuItem>
                <ContextMenuItem onClick={closeAllTabs}>
                    <XIcon className="w-4 h-4 mr-2" /> Close All
                </ContextMenuItem>
                <ContextMenuItem onClick={() => closeOtherTabs(tab.entityId)}>
                    <XIcon className="w-4 h-4 mr-2" /> Close Others
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}

function Tabs({ tabs, currentTab }: { tabs: IEntityEditorTab[]; currentTab?: IEntityEditorTab }) {
    const entitiesChangelist = useEditorState((store) => store.getEntitiesChangelist())
    const container = useRef<HTMLDivElement>(null)

    return (
        <div
            ref={container}
            className="flex overflow-x-auto shrink-0 no-scrollbar"
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
                    <Tab
                        tab={tab}
                        key={tab.entityId}
                        active={currentTab?.entityId === tab.entityId}
                        entitiesChangelist={entitiesChangelist}
                    />
                )
            })}
        </div>
    )
}

export function EntityEditorTabs({
    toggleEntityBrowserPanel
}: {
    toggleEntityBrowserPanel(): void
}) {
    const { tabs, activeTabEntityID } = useContext(EntityEditorTabsContext)
    const { showCreateEntityModal } = useContext(GlobalModalContext)

    const currentTab = useMemo(() => {
        return tabs.find((tab) => tab.entityId === activeTabEntityID)
    }, [activeTabEntityID, tabs])

    if (tabs.length == 0) {
        return (
            <div className="flex flex-col justify-center items-center h-full">
                <Package className="w-52 h-52 mb-20 text-muted" />
                <div>Select an Entity on the left</div>
                <div className="mt-2 text-muted-foreground">or</div>
                <div>
                    <Button variant="link" onClick={() => showCreateEntityModal()}>
                        <Plus className="w-4 h-4 mr-2" /> Create a new Entity
                    </Button>
                </div>
            </div>
        )
    } else {
        return (
            <div className="h-full flex flex-col">
                <Tabs tabs={tabs} currentTab={currentTab} />
                <div className="overflow-auto">
                    {currentTab ? (
                        <EntityEditor
                            key={currentTab.entityId}
                            entityId={currentTab.entityId}
                            toggleEntityBrowserPanel={toggleEntityBrowserPanel}
                        />
                    ) : null}
                </div>
            </div>
        )
    }
}
