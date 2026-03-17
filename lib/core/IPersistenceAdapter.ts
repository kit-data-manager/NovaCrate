import { IObservable } from "@/lib/core/IObservable"

export type IPersistenceAdapterEvents = {
    "graph-changed": (newGraph: ICrate["@graph"]) => void
    "context-changed": (newContext: ICrate["@context"]) => void
}

export interface IPersistenceAdapter {
    readonly events: IObservable<IPersistenceAdapterEvents>

    getMetadataGraph(): Promise<ICrate["@graph"]>
    getMetadataContext(): Promise<ICrate["@context"]>
    updateMetadataGraph(metadata: ICrate["@graph"]): Promise<void>
    updateMetadataContext(context: ICrate["@context"]): Promise<void>
}
