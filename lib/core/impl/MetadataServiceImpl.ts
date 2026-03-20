import { IMetadataService, IMetadataServiceEvents } from "@/lib/core/IMetadataService"
import { IObservable } from "@/lib/core/IObservable"
import { Observable } from "@/lib/core/impl/Observable"
import { IPersistenceAdapter } from "@/lib/core/IPersistenceAdapter"
import {
    changeEntityIdOccurrences,
    deepEqual,
    getRootEntityID,
    isDataEntity,
    normalizeIdentifier
} from "@/lib/utils"

export class MetadataServiceImpl implements IMetadataService {
    private graph: Map<string, IEntity> = new Map()
    private _events = new Observable<IMetadataServiceEvents>()
    readonly events: IObservable<IMetadataServiceEvents> = this._events

    constructor(private persistenceAdapter: IPersistenceAdapter) {
        this.updateGraph = this.updateGraph.bind(this)
        persistenceAdapter.events.addEventListener("graph-changed", this.updateGraph)
    }

    async addEntity(entity: IEntity, overwrite: boolean = false): Promise<boolean> {
        if (this.graph.has(entity["@id"])) {
            if (overwrite) {
                this.graph.set(entity["@id"], entity)
            } else return false
        }

        this.graph.set(entity["@id"], entity)

        if (isDataEntity(entity)) {
            this.addToHasPart(entity["@id"])
        }

        this._events.emit("graph-changed", this.graphAsArray())
        await this.persistenceAdapter.updateMetadataGraph(this.graphAsArray())
        return true
    }

    private getRootEntity(): IEntity | undefined {
        const rootId = getRootEntityID(this.graph)
        return rootId ? this.graph.get(rootId) : undefined
    }

    private addToHasPart(referencedEntityId: string) {
        const root = this.getRootEntity()
        if (!root)
            return console.warn(
                "Failed to add data entity to hasPart because root entity could not be found"
            )
        if ("hasPart" in root) {
            if (Array.isArray(root.hasPart)) {
                root.hasPart.push({ "@id": referencedEntityId })
            } else {
                console.warn(
                    "Failed to add data entity to hasPart because root entity has malformed hasPart property"
                )
            }
        } else {
            root.hasPart = [{ "@id": referencedEntityId }]
        }
    }

    private removeFromHasPart(referencedEntityId: string) {
        const root = this.getRootEntity()
        if (!root)
            return console.warn(
                "Failed to remove data entity from hasPart because root entity could not be found"
            )
        if ("hasPart" in root) {
            if (Array.isArray(root.hasPart)) {
                const index = root.hasPart.findIndex(
                    (e) => typeof e !== "string" && e["@id"] === referencedEntityId
                )
                if (index >= 0) root.hasPart.splice(index, 1)
            } else {
                console.warn(
                    "Failed to add data entity to hasPart because root entity has malformed hasPart property"
                )
            }
        }
    }

    async changeEntityIdentifier(from: string, to: string): Promise<void> {
        let affectedEntities: string[] = []

        if (this.graph.keys().find((e) => normalizeIdentifier(e) === normalizeIdentifier(to))) {
            throw `Entity with ID ${to} already exists`
        }

        if (from.endsWith("/")) {
            affectedEntities = this.graph
                .keys()
                .filter((id) => {
                    return (
                        normalizeIdentifier(id).startsWith(normalizeIdentifier(from)) &&
                        normalizeIdentifier(id) !== normalizeIdentifier(from)
                    )
                })
                .toArray()
        }

        const graphAsArray = this.graphAsArray()

        changeEntityIdOccurrences(graphAsArray, from, to)

        for (const entity of affectedEntities) {
            changeEntityIdOccurrences(
                graphAsArray,
                entity,
                normalizeIdentifier(entity).replace(normalizeIdentifier(from), to)
            )
        }

        this._events.emit("graph-changed", this.graphAsArray())
        await this.persistenceAdapter.updateMetadataGraph(graphAsArray)
    }

    async deleteEntity(id: string): Promise<void> {
        if (this.graph.has(id)) {
            this.graph.delete(id)
        }

        this.removeFromHasPart(id)

        this._events.emit("graph-changed", this.graphAsArray())
        await this.persistenceAdapter.updateMetadataGraph(this.graphAsArray())
    }

    getEntities() {
        return this.graphAsArray()
    }

    async updateEntity(entity: IEntity): Promise<void> {
        const existing = this.graph.get(entity["@id"])

        if (existing) {
            for (const [key, value] of Object.entries(entity)) {
                if (value === null && key in existing) {
                    delete existing[key]
                } else {
                    existing[key] = value
                }
            }

            for (const [key] of Object.entries(existing)) {
                if (!(key in entity)) {
                    delete existing[key]
                }
            }
        } else {
            this.graph.set(entity["@id"], entity)
        }

        this._events.emit("graph-changed", this.graphAsArray())
        await this.persistenceAdapter.updateMetadataGraph(this.graphAsArray())
    }

    dispose() {
        this.persistenceAdapter.events.removeEventListener("graph-changed", this.updateGraph)
    }

    static async newInstance(persistenceAdapter: IPersistenceAdapter) {
        const service = new MetadataServiceImpl(persistenceAdapter)
        const graph = await persistenceAdapter.getMetadataGraph()
        service.updateGraph(graph)
        return service
    }

    private updateGraph(newEntities: IEntity[]) {
        if (deepEqual(newEntities, this.graphAsArray())) return
        this.graph = new Map(newEntities.map((entity) => [entity["@id"], entity]))
        this._events.emit("graph-changed", newEntities)
    }

    private graphAsArray() {
        return Array.from(this.graph.values())
    }
}
