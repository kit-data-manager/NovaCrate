import { create } from "zustand"

export type SchemaTermResolutionStatus = "idle" | "loading" | "loaded" | "error"

export type ResolvedTermComment = string | { "@language": string; "@value": string }

export interface ResolvedSchemaTerm {
    status: SchemaTermResolutionStatus
    comment?: ResolvedTermComment
    /** The schema id or URL the term was resolved from. */
    resolvedFrom?: string
    error?: unknown
}

/**
 * Per-term resolution status cache ("SchemaStore").
 *
 * Tracks the status of schema term resolutions to drive UI loading indicators
 * and memoized lookups. In-memory only, not persisted.
 */
export interface SchemaResolverState {
    terms: Record<string, ResolvedSchemaTerm>
    markLoading(term: string): void
    markResolved(term: string, info: { comment?: ResolvedTermComment; resolvedFrom?: string }): void
    markFailed(term: string, error: unknown): void
    reset(term: string): void
    clear(): void
}

export const useSchemaResolverState = create<SchemaResolverState>()((set) => ({
    terms: {},

    markLoading(term: string) {
        set((state) => ({
            terms: { ...state.terms, [term]: { status: "loading" } }
        }))
    },

    markResolved(term: string, info: { comment?: ResolvedTermComment; resolvedFrom?: string }) {
        set((state) => ({
            terms: { ...state.terms, [term]: { status: "loaded", ...info } }
        }))
    },

    markFailed(term: string, error: unknown) {
        set((state) => ({
            terms: { ...state.terms, [term]: { status: "error", error } }
        }))
    },

    reset(term: string) {
        set((state) => {
            const { [term]: _removed, ...rest } = state.terms
            return { terms: rest }
        })
    },

    clear() {
        set({ terms: {} })
    }
}))
