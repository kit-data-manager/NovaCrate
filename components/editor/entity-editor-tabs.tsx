"use client"

import { MutableRefObject, useCallback, useContext, useEffect, useMemo, useRef } from "react"
import { EntityEditorTabsContext, IEntityEditorTab } from "@/components/entity-tabs-provider"
import { getEntityDisplayName } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Braces, Plus, XIcon } from "lucide-react"
import { EntityIcon } from "@/components/entity-icon"
import { CrateDataContext } from "@/components/crate-data-provider"
import { VirtualEntityEditor } from "@/components/editor/virtual-entity-editor"
import { EntityEditorCallbacks } from "@/components/editor/use-virtual-entity-editor"

function Tab({ tab, active }: { tab: IEntityEditorTab; active: boolean }) {
    const { focusTab, closeTab } = useContext(EntityEditorTabsContext)
    const { crateData } = useContext(CrateDataContext)

    const button = useRef<HTMLButtonElement>(null)

    const focus = useCallback(() => {
        focusTab(tab.entityId)
    }, [focusTab, tab.entityId])

    const close = useCallback(() => {
        closeTab(tab.entityId)
    }, [closeTab, tab.entityId])

    const entity = useMemo(() => {
        if (crateData) {
            return crateData["@graph"].find((e) => e["@id"] === tab.entityId)
        }
    }, [crateData, tab.entityId])

    useEffect(() => {
        if (button.current && active) {
            button.current.scrollIntoView()
        }
    })

    if (!entity)
        return (
            <Button
                variant="tab"
                data-active={active}
                className={`cursor-default text-destructive ${active ? "pr-1" : ""}`}
                ref={button}
            >
                <div className={`ml-1 transition-colors max-w-[300px] truncate`}>
                    Entity not found
                </div>
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
                {tab.dirty ? <b>*</b> : null}
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
    )
}

function Tabs({ tabs, currentTab }: { tabs: IEntityEditorTab[]; currentTab?: IEntityEditorTab }) {
    const container = useRef<HTMLDivElement>(null)

    return (
        <div
            ref={container}
            className="flex overflow-x-auto shrink-0"
            onWheel={(s) => {
                if (s.deltaY !== 0 && container.current) {
                    // noinspection JSSuspiciousNameCombination
                    container.current.scrollBy({
                        left: s.deltaY,
                        top: 0,
                        behavior: "smooth"
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
                    />
                )
            })}
        </div>
    )
}

export function EntityEditorTabs() {
    const { tabs, activeTabEntityID } = useContext(EntityEditorTabsContext)
    const virtualEntityEditorRefs: MutableRefObject<Record<string, EntityEditorCallbacks>> = useRef(
        {}
    )

    const currentTab = useMemo(() => {
        return tabs.find((tab) => tab.entityId === activeTabEntityID)
    }, [activeTabEntityID, tabs])

    const hasUnsavedChanges = useMemo(() => {
        return tabs.find((tab) => tab.dirty) !== undefined
    }, [tabs])

    const registerVirtualEntityEditorRef = useCallback(
        (ref: EntityEditorCallbacks | null, entityId: string) => {
            if (entityId in virtualEntityEditorRefs.current) {
                if (ref) {
                    virtualEntityEditorRefs.current[entityId] = ref
                } else {
                    delete virtualEntityEditorRefs.current[entityId]
                }
            } else if (ref) {
                virtualEntityEditorRefs.current[entityId] = ref
            }
        },
        []
    )

    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault()
            return "There are unsaved changes."
        }

        if (hasUnsavedChanges) {
            window.addEventListener("beforeunload", handler)
        }

        return () => {
            if (hasUnsavedChanges) {
                window.removeEventListener("beforeunload", handler)
            }
        }
    }, [hasUnsavedChanges])

    if (tabs.length == 0) {
        return (
            <div className="flex flex-col justify-center items-center h-full text-muted-foreground">
                <Braces className="w-52 h-52 mb-20 text-muted" />
                <div>Select an Entity on the left</div>
                <div className="mt-2">or</div>
                <div>
                    <Button variant="link">
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
                    {tabs.map((tab) => {
                        return (
                            <VirtualEntityEditor
                                key={tab.entityId}
                                tab={tab}
                                render={tab === currentTab}
                                ref={(ref) => registerVirtualEntityEditorRef(ref, tab.entityId)}
                            />
                        )
                    })}
                </div>
            </div>
        )
    }
}
