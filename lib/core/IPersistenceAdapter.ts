import { IObservable } from "@/lib/core/IObservable"

export type IPersistenceAdapterEvents = {
    /** Fired when the raw metadata JSON changes externally (e.g. the user edits
     *  it directly in the JSON editor). Passes the freshly parsed `@graph`. */
    "graph-changed": (newGraph: ICrate["@graph"]) => void
    /** Fired when the raw metadata JSON changes externally. Passes the freshly
     *  parsed `@context`. */
    "context-changed": (newContext: ICrate["@context"]) => void
}

/**
 * Adapter that bridges the persistence layer
 * ({@link ICrateService}, which deals in raw JSON strings) and the core layer
 * ({@link IMetadataService} / {@link IContextService}, which work with typed
 * `ICrate` objects).
 *
 * Responsibilities:
 * - Reads the raw `ro-crate-metadata.json` string from {@link ICrateService}
 *   and parses it into typed `@graph` and `@context` objects for the core layer.
 * - Accepts updated `@graph` / `@context` objects from the core layer,
 *   serialises them back to JSON, and writes them via {@link ICrateService}.
 * - Forwards `"metadata-changed"` events from {@link ICrateService} as separate
 *   `"graph-changed"` and `"context-changed"` events so the core services
 *   can react to external changes (e.g. direct JSON edits).
 */
export interface IPersistenceAdapter {
    readonly events: IObservable<IPersistenceAdapterEvents>

    /** Parse and return the `@graph` from the current `ro-crate-metadata.json`. */
    getMetadataGraph(): Promise<ICrate["@graph"]>
    /** Parse and return the `@context` from the current `ro-crate-metadata.json`. */
    getMetadataContext(): Promise<ICrate["@context"]>
    /**
     * Serialise `metadata` and persist it as the `@graph` portion of
     * `ro-crate-metadata.json` (merged with the existing `@context`).
     */
    updateMetadataGraph(metadata: ICrate["@graph"]): Promise<void>
    /**
     * Serialise `context` and persist it as the `@context` portion of
     * `ro-crate-metadata.json` (merged with the existing `@graph`).
     */
    updateMetadataContext(context: ICrate["@context"]): Promise<void>
}
