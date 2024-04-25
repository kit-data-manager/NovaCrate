import { isEntityEqual, propertyHasChanged } from "@/lib/utils"

export function computeServerDifferences(
    crateData: ICrate,
    lastCrateData: ICrate,
    entities: IFlatEntity[]
) {
    const lastEntities = lastCrateData["@graph"].slice()
    const forceEntities: IFlatEntity[] = []
    const forceProperties: Record<string, [string, FlatEntityPropertyTypes]> = {}

    for (const entity of crateData["@graph"]) {
        const internalEntity = entities.find((e) => e["@id"] === entity["@id"])
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
    oldInternalData: IFlatEntity[],
    forceEntities: IFlatEntity[],
    forceProperties: Record<string, [string, FlatEntityPropertyTypes]>
) {
    const copy = [...oldInternalData]

    for (const update of forceEntities) {
        const index = copy.findIndex((e) => e["@id"] === update["@id"])
        if (index < 0) copy.push(update)
        else copy.splice(index, 1, { ...update })
    }

    for (const [updatedEntityId, data] of Object.entries(forceProperties)) {
        const [property, value] = data
        const index = copy.findIndex((e) => e["@id"] === updatedEntityId)
        if (index < 0) {
            console.error(
                "Unable to force update property, because the entity does not exist",
                updatedEntityId,
                property,
                value
            )
            continue
        }
        const entity = copy[index]
        const newEntity = { ...entity }
        newEntity[property] = value
        copy.splice(index, 1, newEntity)
    }

    return copy
}
