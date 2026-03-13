export type IMetadataServiceEvents = {
    "entity-changed": (current: IEntity, old: IEntity) => void
    "entity-deleted": (id: string) => void
    "entity-created": (entity: IEntity) => void
}

export interface IMetadataService {
    getEntities(): Promise<IEntity[]>
    addEntity(entity: string): Promise<void>
    updateEntity(entity: string): Promise<void>
    changeEntityIdentifier(from: string, to: string): Promise<void>
    deleteEntity(id: string): Promise<void>
}
