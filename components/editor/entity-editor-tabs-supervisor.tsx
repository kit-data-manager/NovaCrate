"use client"

import { editorState, useEditorState } from "@/lib/state/editor-state"
import { useEffect, useRef } from "react"
import { Diff } from "@/lib/utils"
import { createEntityEditorTab, useEntityEditorTabs } from "@/lib/state/entity-editor-tabs-state"
import { useShallow } from "zustand/react/shallow"
import { usePathname, useRouter } from "next/navigation"
import { useHash } from "@/lib/hooks"

/**
 * Maintains the state of entity editor tabs by opening tabs for changed or new entities
 * and for the root entity when the editor is initialized.
 *
 * This function observes changes made to entities and ensures that any relevant changes
 * are reflected in the editor tabs. For new or modified entities present in the changelist,
 * a corresponding tab is opened if it doesn't already exist. Additionally, it ensures that
 * the root entity tab is opened once during initialization.
 *
 * This function also takes care of the hash-based entity tab navigation.
 *
 * @return Always returns `null` as this function does not render any UI components
 * directly but handles state-side operations for editor tabs.
 */
export function EntityEditorTabsSupervisor() {
    const entitiesChangelist = useEditorState(useShallow((store) => store.getEntitiesChangelist()))
    const entities = useEditorState((store) => store.entities)
    const rootEntityId = useEditorState((store) => store.getRootEntityId())
    const tabs = useEntityEditorTabs((store) => store.tabs)
    const activeTabEntityID = useEntityEditorTabs((store) => store.activeTabEntityID)
    const openTab = useEntityEditorTabs((store) => store.openTab)
    const router = useRouter()
    const { hash } = useHash()
    const path = usePathname()

    /**
     * Searches for any changed or new entities and opens a tab for each
     */
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

    /**
     * Opens a tab for the root entity on startup
     */
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

    const hashRef = useRef(hash)
    useEffect(() => {
        hashRef.current = hash
    }, [hash])

    /**
     * Updates the URL hash when the active tab changes.
     */
    useEffect(() => {
        const newHash = "#" + encodeURIComponent(activeTabEntityID)
        if (newHash === hashRef.current || path !== "/editor/full/entities") return
        router.push(newHash)
    }, [activeTabEntityID, path, router])

    const activeTabEntityIDRef = useRef(activeTabEntityID)
    useEffect(() => {
        activeTabEntityIDRef.current = activeTabEntityID
    }, [activeTabEntityID])

    /**
     * Whenever the current hash changes, it checks if the entity ID matches the active tab. If not, the corresponding tab is opened.
     */
    useEffect(() => {
        const entityId = decodeURIComponent(hash.slice(1))
        if (entityId === activeTabEntityIDRef.current) return

        const entities = editorState.getState().entities
        if (entities.has(entityId)) {
            const tab = useEntityEditorTabs.getState().tabs.find((tab) => tab.entityId === entityId)
            if (tab) {
                openTab(tab, true)
            } else {
                const entity = entities.get(entityId)
                if (entity) {
                    openTab(createEntityEditorTab(entity), true)
                }
            }
        }
    }, [hash, openTab])

    return null
}
