"use client"

import { useCallback, useContext, useEffect, useMemo, useRef } from "react"
import { EntityEditorTabsContext, IEntityEditorTab } from "@/components/entity-tabs-provider"
import { EntityEditor } from "@/components/editor/entity-editor"
import { getEntityDisplayName } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Braces, Plus, XIcon } from "lucide-react"
import { EntityBrowserItemIcon } from "@/components/entity-browser"

function Tab({ tab, active }: { tab: IEntityEditorTab; active: boolean }) {
    const { focusTab, closeTab } = useContext(EntityEditorTabsContext)

    const button = useRef<HTMLButtonElement>(null)

    const focus = useCallback(() => {
        focusTab(tab.entity["@id"])
    }, [focusTab, tab.entity])

    const close = useCallback(() => {
        closeTab(tab.entity["@id"])
    }, [closeTab, tab.entity])

    useEffect(() => {
        if (button.current && active) {
            button.current.scrollIntoView()
        }
    })

    return (
        <Button
            onClick={focus}
            variant="tab"
            data-active={active}
            className={`cursor-default ${active ? "pr-1" : ""}`}
            ref={button}
        >
            <EntityBrowserItemIcon entity={tab.entity} />
            <div className="ml-1">{getEntityDisplayName(tab.entity)}</div>
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

export function EntityEditorTabs() {
    const { tabs, activeTabEntityID } = useContext(EntityEditorTabsContext)

    const container = useRef<HTMLDivElement>(null)

    const currentTab = useMemo(() => {
        return tabs.find((tab) => tab.entity["@id"] === activeTabEntityID)
    }, [activeTabEntityID, tabs])

    const Tabs = useCallback(() => {
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
                            key={tab.entity["@id"]}
                            active={currentTab?.entity["@id"] === tab.entity["@id"]}
                        />
                    )
                })}
            </div>
        )
    }, [currentTab?.entity, tabs])

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
                <Tabs />
                <div className="overflow-auto">
                    {currentTab ? <EntityEditor entityData={currentTab.entity} /> : null}
                </div>
            </div>
        )
    }
}
