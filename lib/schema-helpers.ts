import { schemaGraph } from "@/lib/crate-verify/SchemaGraph"

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
