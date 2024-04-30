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

// TODO use these to properly compare old crate data and new crate data
function compareRecords<A extends Record<string, unknown>, B extends Record<string, unknown>>(
    a: A,
    b: B
) {
    const onlyInA: string[] = []
    const onlyInB: string[] = []
    const shared: string[] = []

    Object.keys(a)
        .filter((key) => !Object.keys(b).includes(key))
        .forEach((key) => onlyInA.push(key))
    Object.keys(b)
        .filter((key) => !Object.keys(a).includes(key))
        .forEach((key) => onlyInB.push(key))
    Object.keys(a)
        .filter((key) => Object.keys(b).includes(key))
        .forEach((key) => shared.push(key))

    function handleOnlyInA(cb: (key: string) => void) {
        onlyInA.forEach(cb)
    }

    function handleOnlyInB(cb: (key: string) => void) {
        onlyInB.forEach(cb)
    }

    function handleShared(cb: (key: string) => void) {
        shared.forEach(cb)
    }

    return { handleOnlyInA, handleOnlyInB, handleShared }
}

function compareEntities(a: IFlatEntity, b: IFlatEntity) {
    const { handleOnlyInA, handleOnlyInB, handleShared } = compareRecords(a, b)
    const unchanged: string[] = []
    const changed: string[] = []

    handleShared((key) => {
        const propA = a[key]
        const propB = b[key]
        if (propertyHasChanged(propA, propB)) {
            changed.push(key)
        } else {
            unchanged.push(key)
        }
    })

    function handleUnchanged(cb: (key: string) => void) {
        unchanged.forEach(cb)
    }

    function handleChanged(cb: (key: string) => void) {
        changed.forEach(cb)
    }

    return { handleOnlyInA, handleOnlyInB, handleChanged, handleUnchanged }
}
