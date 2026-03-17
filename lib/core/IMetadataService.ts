import { IObservable } from "@/lib/core/IObservable"

export type IMetadataServiceEvents = {
    "graph-changed": (newGraph: IEntity[]) => void
}

export interface IMetadataService {
    readonly events: IObservable<IMetadataServiceEvents>

    getEntities(): IEntity[]
    addEntity(entity: IEntity, overwrite?: boolean): Promise<boolean>
    updateEntity(entity: IEntity): Promise<void>
    changeEntityIdentifier(from: string, to: string): Promise<void>
    deleteEntity(id: string): Promise<void>
}
