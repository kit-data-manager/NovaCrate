import { IObservable } from "@/lib/core/IObservable"
import { RO_CRATE_VERSION } from "@/lib/constants"

export type IContextServiceEvents = {
    /** Fired whenever the active context changes — either because the underlying
     *  crate metadata was reloaded, or because a custom pair was added/removed. */
    "context-changed": () => void
}

/**
 * Manages the `@context` of the currently open RO-Crate.
 *
 * The context determines how short-form term names (e.g. `"name"`) map to full
 * URIs (e.g. `"https://schema.org/name"`). This service exposes the detected
 * RO-Crate specification version, a flag for whether a fallback context is in
 * use, and the set of custom prefix→URL pairs that extend the base context.
 *
 * Emits `"context-changed"` whenever the context is mutated. Subscribe via
 * {@link IContextService.events}.
 *
 * @see {@link IContextResolverService} for a read-only lookup-only view of the context.
 */
export interface IContextService {
    readonly events: IObservable<IContextServiceEvents>
    /**
     * The RO-Crate specification version detected from the `@context` URL,
     * or `undefined` if the version could not be determined.
     */
    readonly specification: RO_CRATE_VERSION | undefined
    /**
     * `true` when the crate's `@context` does not match any known RO-Crate
     * specification and a bundled fallback context is being used instead.
     */
    readonly usingFallback: boolean
    /** Custom prefix→URL pairs that have been added on top of the base context. */
    readonly customPairs: Record<string, string>
    /**
     * Remove a custom context pair by its prefix key.
     * Emits `"context-changed"` via {@link IContextService.events}.
     */
    removeCustomContextPair(prefix: string): void
    /**
     * Add (or overwrite) a custom context pair mapping `prefix` to `url`.
     * Emits `"context-changed"` via {@link IContextService.events}.
     */
    addCustomContextPair(prefix: string, url: string): void
}
