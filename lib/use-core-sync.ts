import { useEffect, useRef } from "react"
import { produce } from "immer"
import { ICoreService } from "@/lib/core/ICoreService"
import { editorState } from "@/lib/state/editor-state"
import { applyGraphDifferences } from "@/lib/ensure-sync"

/**
 * Subscribes to the core layer's `graph-changed` and `context-changed` events
 * and pushes updates into the Zustand {@link editorState}.
 *
 * Called inside `CoreProvider` to keep the Zustand editor state in sync
 * with the core layer's event-driven updates.
 *
 * **Graph sync strategy**:
 * - On first load (or when `lastGraph` is empty): hard-replaces `entities`.
 * - On subsequent events: applies a three-way merge via {@link applyGraphDifferences}
 *   so that local edits the user has made are preserved when the remote graph
 *   changes (e.g. from a metadata write round-trip).
 *
 * **Context sync strategy**:
 * - Always overwrites both `crateContext` and `initialCrateContext` since the
 *   editor does not support local context editing that diverges from remote.
 *
 * Must be called inside a component that has access to an `ICoreService` (i.e.
 * inside a `CoreProvider`). Passing `null` is safe and results in a no-op.
 */
export function useCoreSync(core: ICoreService | null) {
    const lastGraphRef = useRef<IEntity[]>([])

    useEffect(() => {
        if (!core) return

        const metadataService = core.getMetadataService()
        const contextService = core.getContextService()

        const {
            setEntities,
            setInitialEntities,
            updateCrateContext,
            updateInitialCrateContext,
            getEntities
        } = editorState.getState()

        // --- Initial population ---

        const initialEntities = metadataService.getEntities()
        const entityMap = new Map(initialEntities.map((e) => [e["@id"], e]))
        setEntities(entityMap)
        setInitialEntities(new Map(initialEntities.map((e) => [e["@id"], e])))
        lastGraphRef.current = initialEntities

        const initialContext = contextService.getRaw()
        if (initialContext !== undefined) {
            updateCrateContext(initialContext)
            updateInitialCrateContext(initialContext)
        }

        // --- Graph event subscription ---

        const removeGraphListener = metadataService.events.addEventListener(
            "graph-changed",
            (newGraph: IEntity[]) => {
                const newInitialEntities = new Map(newGraph.map((e) => [e["@id"], e]))
                setInitialEntities(newInitialEntities)

                const lastGraph = lastGraphRef.current

                if (lastGraph.length === 0 || getEntities().size === 0) {
                    // First load or reset: hard-replace the working copy
                    setEntities(new Map(newGraph.map((e) => [e["@id"], e])))
                } else {
                    // Subsequent loads: three-way merge to preserve local edits
                    const currentEntities = getEntities()
                    const merged = produce(currentEntities, (draft) => {
                        applyGraphDifferences(newGraph, lastGraph, draft)
                    })
                    setEntities(merged)
                }

                lastGraphRef.current = newGraph
            }
        )

        // --- Context event subscription ---

        const removeContextListener = contextService.events.addEventListener(
            "context-changed",
            (newContext: CrateContextType) => {
                updateCrateContext(newContext)
                updateInitialCrateContext(newContext)
            }
        )

        return () => {
            removeGraphListener()
            removeContextListener()
        }
    }, [core])
}
