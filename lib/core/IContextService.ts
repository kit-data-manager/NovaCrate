import { IObservable } from "@/lib/core/IObservable"
import { RO_CRATE_VERSION } from "@/lib/constants"

export type IContextServiceEvents = {
    "context-changed": () => void
}

export interface IContextService {
    readonly events: IObservable<IContextServiceEvents>
    readonly specification: RO_CRATE_VERSION | undefined
    readonly usingFallback: boolean
    readonly customPairs: Record<string, string>
    removeCustomContextPair(prefix: string): void
    addCustomContextPair(prefix: string, url: string): void
}
