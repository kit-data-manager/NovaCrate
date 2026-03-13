import { IObservable } from "@/lib/core/observable"

export type IContextServiceEvents = {
    "context-changed": () => void
}

export interface IContextService {
    readonly events: IObservable<IContextServiceEvents>
}
