import { useEffect, useRef } from "react"
import { produce } from "immer"
import { ICoreService } from "@/lib/core/ICoreService"
import { CrateContextState, editorState } from "@/lib/state/editor-state"
import { applyGraphDifferences } from "@/lib/ensure-sync"
import { IContextService } from "@/lib/core/IContextService"

/**
 * Build a plain-data {@link CrateContextState} snapshot from the live
 * {@link IContextService}. The snapshot is safe to store in Zustand (all values
 * are cloned by the service's getters; we additionally `structuredClone` the
 * whole result to guard against future implementations that might not clone).
 */
function buildContextSnapshot(service: IContextService): CrateContextState {
    return structuredClone({
        specification: service.specification,
        usingFallback: service.usingFallback,
        customPairs: service.customPairs,
        context: service.context,
        errors: service.errors
    })
}

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
 * - Reads the already-parsed context data from {@link IContextService} and
 *   stores a plain-data snapshot in the Zustand store. No async parsing
 *   happens inside the store — the core layer handles all context parsing.
 * - Uses JSON.stringify comparison on the raw `@context` value to avoid
 *   redundant store updates.
 *
 * Must be called inside a component that has access to an `ICoreService` (i.e.
 * inside a `CoreProvider`). Passing `null` is safe and results in a no-op.
 */
export function useCoreSync(core: ICoreService | null) {
    const lastGraphRef = useRef<IEntity[]>([])
    const lastRawContextRef = useRef<string | undefined>(undefined)

    useEffect(() => {
        if (!core) return

        const metadataService = core.getMetadataService()
        const contextService = core.getContextService()

        const { setEntities, setInitialEntities, setCrateContext, getEntities } =
            editorState.getState()

        // --- Initial population ---

        const initialEntities = metadataService.getEntities()
        const entityMap = new Map(initialEntities.map((e) => [e["@id"], e]))
        setEntities(entityMap)
        setInitialEntities(new Map(initialEntities.map((e) => [e["@id"], e])))
        lastGraphRef.current = initialEntities

        const initialRaw = contextService.getRaw()
        if (initialRaw !== undefined) {
            const snapshot = buildContextSnapshot(contextService)
            setCrateContext(snapshot)
            lastRawContextRef.current = JSON.stringify(initialRaw)
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
            (newRawContext: CrateContextType) => {
                const serialized = JSON.stringify(newRawContext)
                if (serialized === lastRawContextRef.current) return

                lastRawContextRef.current = serialized
                const snapshot = buildContextSnapshot(contextService)
                setCrateContext(snapshot)
            }
        )

        return () => {
            removeGraphListener()
            removeContextListener()
        }
    }, [core])
}
