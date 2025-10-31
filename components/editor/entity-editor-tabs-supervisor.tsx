"use client"

import { useEditorState } from "@/lib/state/editor-state"
import { useEffect, useRef } from "react"
import { Diff } from "@/lib/utils"
import { createEntityEditorTab, useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"
import { useShallow } from "zustand/react/shallow"

export function EntityEditorTabsSupervisor() {
    const entitiesChangelist = useEditorState(useShallow((store) => store.getEntitiesChangelist()))
    const entities = useEditorState((store) => store.entities)
    const rootEntityId = useEditorState((store) => store.getRootEntityId())
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

    const rootOpened = useRef(false)
    useEffect(() => {
        if (rootOpened.current || !rootEntityId) return

        const root = entities.get(rootEntityId)
        if (root) {
            openTab(createEntityEditorTab(root), true)
            rootOpened.current = true
        } else if (entities.size > 0) {
            // Assume entities are done with loading and there is no root
            rootOpened.current = true
        }
    }, [entities, openTab, rootEntityId])

    return null
}
