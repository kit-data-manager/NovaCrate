import { useContext, useEffect } from "react"
import { SchemaWorker } from "@/components/providers/schema-worker-provider"
import { FunctionWorker } from "@/lib/function-worker"
import {
    ResolvedTermComment,
    SchemaTermResolutionStatus,
    useSchemaResolverState
} from "@/lib/state/schema-resolver-state"
import { schemaWorkerFunctions } from "@/lib/schema-worker/helpers"

type SchemaWorkerType = FunctionWorker<typeof schemaWorkerFunctions>

/** The minimal worker surface needed to resolve a term. */
export type TermResolutionWorker = Pick<SchemaWorkerType, "executeUncached">

export interface TermCommentResult {
    status: SchemaTermResolutionStatus | undefined
    comment?: ResolvedTermComment
    error?: unknown
}

/**
 * Deduplicates term resolutions across the whole application. Without this,
 * each component asking for the same term would trigger its own schema fetch
 * inside the worker.
 */
const inFlightResolutions = new Map<string, Promise<void>>()

/**
 * Triggers the resolution of a single term. The term (or its schema) is fetched
 * by the schema worker once; all other consumers wait by subscribing to the
 * {@link useSchemaResolverState} store (see {@link useTermComment}).
 *
 * Known limitation: terms sharing a URL prefix are currently fetched per term,
 * not batched per vocabulary. This is a deliberate simplification to revisit
 * later.
 */
export function resolveTerm(term: string, worker: TermResolutionWorker): Promise<void> {
    const state = useSchemaResolverState.getState()
    const current = state.terms[term]
    if (
        current &&
        (current.status === "loading" || current.status === "loaded" || current.status === "error")
    ) {
        return Promise.resolve()
    }

    const existing = inFlightResolutions.get(term)
    if (existing) return existing

    state.markLoading(term)

    const promise = (async () => {
        try {
            const comment = await worker.executeUncached("getPropertyComment", term)
            useSchemaResolverState.getState().markResolved(term, { comment })
        } catch (error) {
            console.error(`Failed to resolve schema term ${term}:`, error)
            useSchemaResolverState.getState().markFailed(term, error)
        }
    })()

    inFlightResolutions.set(term, promise)
    promise.finally(() => {
        inFlightResolutions.delete(term)
    })

    return promise
}

/**
 * Reactive access to a term's comment. The hook returns immediately and
 * re-renders once the term's schema has been fetched in the background, so
 * callers can display a loading state and then the comment without requesting
 * the term themselves.
 *
 * Pass `null` (or leave the term unset) to disable resolution.
 */
export function useTermComment(term: string | null): TermCommentResult {
    const { worker, isReady } = useContext(SchemaWorker)
    const info = useSchemaResolverState((state) => (term ? state.terms[term] : undefined))

    useEffect(() => {
        if (!term || !isReady) return
        const current = useSchemaResolverState.getState().terms[term]
        if (
            current &&
            (current.status === "loading" || current.status === "loaded" || current.status === "error")
        ) {
            return
        }
        void resolveTerm(term, worker)
    }, [isReady, term, worker])

    return {
        status: info?.status,
        comment: info?.comment,
        error: info?.error
    }
}
