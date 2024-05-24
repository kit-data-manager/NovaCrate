import { propertyHasChanged } from "@/lib/utils"
import { Draft } from "immer"

export function applyServerDifferences(
    crateData: ICrate,
    lastCrateData: ICrate | undefined,
    newEntities: Draft<Map<string, IFlatEntity>>
) {
    const { handleRemaining, handleRemoved, handleNew } = compareCrateGraphs(
        crateData["@graph"],
        lastCrateData?.["@graph"] || []
    )

    handleNew((entity) => {
        newEntities.set(entity["@id"], entity)
    })

    handleRemoved((entity) => {
        newEntities.delete(entity["@id"])
    })

    handleRemaining(([newEntity, oldEntity]) => {
        const { handleNewProperties, handleRemovedProperties, handleChangedProperties } =
            compareEntities(newEntity, oldEntity)

        handleNewProperties((property) => {
            newEntities.get(newEntity["@id"])![property] = newEntity[property]
        })

        handleRemovedProperties((property) => {
            delete newEntities.get(newEntity["@id"])![property]
        })

        handleChangedProperties((property) => {
            newEntities.get(newEntity["@id"])![property] = newEntity[property]
        })
    })
}

function compareRecords<A extends Record<string, unknown>, B extends Record<string, unknown>>(
    newRecord: A,
    oldRecord: B
) {
    const newKeys: string[] = []
    const removedKeys: string[] = []
    const sharedKeys: string[] = []

    Object.keys(newRecord)
        .filter((key) => !Object.keys(oldRecord).includes(key))
        .forEach((key) => newKeys.push(key))
    Object.keys(oldRecord)
        .filter((key) => !Object.keys(newRecord).includes(key))
        .forEach((key) => removedKeys.push(key))
    Object.keys(newRecord)
        .filter((key) => Object.keys(oldRecord).includes(key))
        .forEach((key) => sharedKeys.push(key))

    function handleNew(cb: (key: string) => void) {
        newKeys.forEach(cb)
    }

    function handleRemoved(cb: (key: string) => void) {
        removedKeys.forEach(cb)
    }

    function handleRemaining(cb: (key: string) => void) {
        sharedKeys.forEach(cb)
    }

    return { handleNew, handleRemoved, handleRemaining }
}

function compareEntities(newEntity: IFlatEntity, oldEntity: IFlatEntity) {
    const { handleRemaining, handleRemoved, handleNew } = compareRecords(newEntity, oldEntity)
    const unchanged: string[] = []
    const changed: string[] = []

    handleRemaining((key) => {
        const propA = newEntity[key]
        const propB = oldEntity[key]
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

    return {
        handleNewProperties: handleNew,
        handleRemovedProperties: handleRemoved,
        handleChangedProperties: handleChanged,
        handleUnchangedProperties: handleUnchanged
    }
}

function compareCrateGraphs(newGraph: ICrate["@graph"], oldGraph: ICrate["@graph"]) {
    const onlyNewEntities: IFlatEntity[] = []
    const onlyRemovedEntities: IFlatEntity[] = []
    const remaining: [IFlatEntity, IFlatEntity][] = []

    for (const entity of newGraph) {
        const old = oldGraph.find((e) => e["@id"] === entity["@id"])
        if (old) {
            remaining.push([entity, old])
        } else {
            onlyNewEntities.push(entity)
        }
    }

    for (const entity of oldGraph) {
        if (!newGraph.find((e) => e["@id"] === entity["@id"])) {
            onlyRemovedEntities.push(entity)
        }
    }

    function handleNew(cb: (entity: IFlatEntity) => void) {
        onlyNewEntities.forEach(cb)
    }

    function handleRemoved(cb: (entity: IFlatEntity) => void) {
        onlyRemovedEntities.forEach(cb)
    }

    function handleRemaining(cb: (entities: [IFlatEntity, IFlatEntity]) => void) {
        remaining.forEach(cb)
    }

    return { handleNew, handleRemoved, handleRemaining }
}
