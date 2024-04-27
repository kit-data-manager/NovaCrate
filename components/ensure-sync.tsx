import { isEntityEqual, propertyHasChanged } from "@/lib/utils"
import { Draft } from "immer"

export function computeServerDifferences(
    crateData: ICrate,
    lastCrateData: ICrate,
    entities: Map<string, IFlatEntity>
) {
    const lastEntities = lastCrateData["@graph"].slice()
    const forceEntities: IFlatEntity[] = []
    const forceProperties: Record<string, [string, FlatEntityPropertyTypes]> = {}

    for (const entity of crateData["@graph"]) {
        const internalEntity = entities.get(entity["@id"])
        if (!internalEntity) {
            forceEntities.push(entity)
        } else {
            const oldEntity = lastEntities.find((e) => e["@id"] === entity["@id"])
            if (oldEntity) {
                if (!isEntityEqual(entity, oldEntity)) {
                    console.warn(
                        "Forcing update of property that was changed on the server. This could cause data loss. Internal state: ",
                        internalEntity
                    )
                    for (const [property, value] of Object.entries(entity)) {
                        if (property in oldEntity) {
                            if (propertyHasChanged(value, oldEntity[property])) {
                                forceProperties[entity["@id"]] = [property, value]
                            }
                        } else {
                            forceProperties[entity["@id"]] = [property, value]
                        }
                    }
                }
            } else {
                forceEntities.push(entity)
            }
        }
    }

    return { forceEntities, forceProperties }
}

export function executeForcedUpdates(
    newEntities: Draft<Map<string, IFlatEntity>>,
    forceEntities: IFlatEntity[],
    forceProperties: Record<string, [string, FlatEntityPropertyTypes]>
) {
    for (const update of forceEntities) {
        newEntities.set(update["@id"], update)
    }

    for (const [updatedEntityId, data] of Object.entries(forceProperties)) {
        const [propertyName, value] = data
        if (newEntities.has(updatedEntityId)) {
            newEntities.get(updatedEntityId)![propertyName] = value
        }
    }
}
