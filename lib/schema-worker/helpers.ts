import { schemaGraph, SchemaNode } from "./SchemaGraph"
import { toArray } from "../utils"

export async function getPropertyComment(propertyId: string) {
    return (await schemaGraph.getNode(propertyId))?.comment
}

export async function getPropertyDomain(propertyId: string) {
    const refs = (await schemaGraph.getNode(propertyId))?.domain
    if (!refs) return []

    if (Array.isArray(refs)) {
        return refs
    } else {
        return [refs]
    }
}

export interface SlimClass {
    "@id": string
    comment: SchemaNode["comment"]
}

export async function getPropertyRange(propertyId: string) {
    let refs = (await schemaGraph.getNode(propertyId))?.range
    if (!refs) return []

    const range = new Set<SlimClass>()
    refs = Array.isArray(refs) ? refs : [refs]

    for (const ref of refs) {
        range.add({
            "@id": schemaGraph.expandCompactIRI(ref["@id"]),
            comment: await getPropertyComment(ref["@id"])
        })

        const subClasses = (await schemaGraph.getSubClasses(ref["@id"])).map((s) =>
            schemaGraph.expandCompactIRI(s)
        )
        for (const subClass of subClasses) {
            range.add({ "@id": subClass, comment: await getPropertyComment(subClass) })
        }
    }

    return Array.from(range)
}

export interface SlimProperty {
    "@id": string
    range: IReference[]
    comment: SchemaNode["comment"]
}

export async function getPossibleEntityProperties(types: string[]) {
    const result: SlimProperty[] = []

    for (const type of types) {
        const properties = (await schemaGraph.getClassProperties(type)).map((node) => {
            return {
                "@id": schemaGraph.expandCompactIRI(node["@id"]),
                range: node.range
                    ? toArray(node.range).map((r) => {
                          return {
                              "@id": schemaGraph.expandCompactIRI(r["@id"])
                          }
                      })
                    : [],
                comment: node.comment
            }
        })
        for (const property of properties) {
            if (!result.find((p) => p["@id"] === property["@id"])) {
                result.push(property)
            }
        }
    }

    return Array.from(result)
}

export function getAllClasses(): SlimClass[] {
    return schemaGraph
        .getAllNodes()
        .filter((n) => n.isClass())
        .map((c) => {
            return {
                "@id": schemaGraph.expandCompactIRI(c["@id"]),
                comment: c.comment
            }
        })
}

export function getAllProperties(): SlimProperty[] {
    return schemaGraph
        .getAllNodes()
        .filter((n) => n.isProperty())
        .map((p) => {
            return {
                "@id": schemaGraph.expandCompactIRI(p["@id"]),
                comment: p.comment,
                range: p.range
                    ? toArray(p.range).map((r) => {
                          return {
                              "@id": schemaGraph.expandCompactIRI(r["@id"])
                          }
                      })
                    : []
            }
        })
}

export async function getAllComments(types: string[]): Promise<SlimClass[]> {
    const result: SlimClass[] = []
    for (const id of types) {
        const node = await schemaGraph.getNode(id)
        if (node) {
            result.push({
                "@id": schemaGraph.expandCompactIRI(node["@id"]),
                comment: node.comment
            })
        }
    }
    return result
}

export function getProvisioningStatus() {
    const workerActive =
        typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope
    const provisionStatus = schemaGraph.provisioningManager.status

    return { workerActive, provisionStatus }
}

export const schemaWorkerFunctions = {
    getAllClasses,
    getPropertyRange,
    getPropertyDomain,
    getPropertyComment,
    getAllComments,
    getAllProperties,
    getPossibleEntityProperties,
    getProvisioningStatus
}
