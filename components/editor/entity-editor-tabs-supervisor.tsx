"use client"

import { useEditorState } from "@/lib/state/editor-state"
import { useEffect } from "react"
import { Diff } from "@/lib/utils"
import { createEntityEditorTab, useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"

export function EntityEditorTabsSupervisor() {
    const entitiesChangelist = useEditorState((store) => store.getEntitiesChangelist())
    const entities = useEditorState.useEntities()
    const tabs = useEntityEditorTabs((store) => store.tabs)
    const openTab = useEntityEditorTabs((store) => store.openTab)

    useEffect(() => {
        for (const [entityId, diff] of entitiesChangelist) {
            if (diff !== Diff.None) {
                if (!tabs.find((tab) => tab.entityId === entityId)) {
                    const entity = entities.get(entityId)
                    if (entity) openTab(createEntityEditorTab(entity))
                }
            }
        }
    }, [entities, entitiesChangelist, openTab, tabs])

    return null
}
