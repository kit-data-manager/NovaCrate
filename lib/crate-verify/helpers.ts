import { schemaGraph } from "./SchemaGraph"

export function getPropertyComment(propertyId: string) {
    return schemaGraph.getNode(propertyId)?.comment
}

export function getPropertyDomain(propertyId: string) {
    const refs = schemaGraph.getNode(propertyId)?.domain
    if (!refs) return []

    if (Array.isArray(refs)) {
        return refs
    } else {
        return [refs]
    }
}

export function getPropertyRange(propertyId: string) {
    let refs = schemaGraph.getNode(propertyId)?.range
    if (!refs) return []

    const range = new Set<string>()
    refs = Array.isArray(refs) ? refs : [refs]

    for (const ref of refs) {
        range.add(schemaGraph.expandIRI(ref["@id"]))
        const subClasses = schemaGraph
            .getSubClasses(ref["@id"])
            .map((s) => schemaGraph.expandIRI(s))
        for (const subClass of subClasses) {
            range.add(subClass)
        }
    }

    return Array.from(range)
}
