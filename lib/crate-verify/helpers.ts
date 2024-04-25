import { schemaGraph, SchemaNode } from "./SchemaGraph"
import { toArray } from "../utils"

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

export interface SlimClass {
    "@id": string
    comment: SchemaNode["comment"]
}

export function getPropertyRange(propertyId: string) {
    let refs = schemaGraph.getNode(propertyId)?.range
    if (!refs) return []

    const range = new Set<SlimClass>()
    refs = Array.isArray(refs) ? refs : [refs]

    for (const ref of refs) {
        range.add({
            "@id": schemaGraph.expandIRI(ref["@id"]),
            comment: getPropertyComment(ref["@id"])
        })

        const subClasses = schemaGraph
            .getSubClasses(ref["@id"])
            .map((s) => schemaGraph.expandIRI(s))
        for (const subClass of subClasses) {
            range.add({ "@id": subClass, comment: getPropertyComment(subClass) })
        }
    }

    return Array.from(range)
}

export interface SlimProperty {
    "@id": string
    range: IReference[]
    comment: SchemaNode["comment"]
}

export function getPossibleEntityProperties(types: string[]) {
    const result: SlimProperty[] = []

    for (const type of types) {
        const properties = schemaGraph.getClassProperties(type).map((node) => {
            return {
                "@id": schemaGraph.expandIRI(node["@id"]),
                range: node.range
                    ? toArray(node.range).map((r) => {
                          return {
                              "@id": schemaGraph.expandIRI(r["@id"])
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
                "@id": schemaGraph.expandIRI(c["@id"]),
                comment: c.comment
            }
        })
}
