import { referenceCheck, toArray } from "../utils"
import { SchemaNode } from "./SchemaNode"
import { SchemaGraph } from "./SchemaGraph"
import { SchemaResolver } from "./SchemaResolver"
import type { SchemaResolverStore } from "@/lib/state/schema-resolver"

const schemaResolver = new SchemaResolver([])
const schemaGraph = new SchemaGraph(schemaResolver)

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
            "@id": ref["@id"],
            comment: await getPropertyComment(ref["@id"])
        })

        const subClasses = await schemaGraph.getSubClasses(ref["@id"])
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

interface PropertyOptions {
    onlyReferences: boolean
}

export async function getPossibleEntityProperties(types: string[], opt?: PropertyOptions) {
    const result: SlimProperty[] = []

    for (const type of types) {
        const properties = (await schemaGraph.getClassProperties(type)).map((node) => {
            return {
                "@id": node["@id"],
                range: node.range
                    ? toArray(node.range).map((r) => {
                          return {
                              "@id": r["@id"]
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

    return Array.from(result).filter((p) =>
        opt?.onlyReferences ? referenceCheck(p.range.map((r) => r["@id"])) : true
    )
}

export function getAllClasses(): SlimClass[] {
    return schemaGraph
        .getAllNodes()
        .filter((n) => n.isClass())
        .map((c) => {
            return {
                "@id": c["@id"],
                comment: c.comment
            }
        })
}

export function getAllProperties(opt?: Partial<PropertyOptions>): SlimProperty[] {
    return schemaGraph
        .getAllNodes()
        .filter((n) => n.isProperty())
        .map((p) => {
            return {
                "@id": p["@id"],
                comment: p.comment,
                range: p.range
                    ? toArray(p.range).map((r) => {
                          return {
                              "@id": r["@id"]
                          }
                      })
                    : []
            }
        })
        .filter((p) => (opt?.onlyReferences ? referenceCheck(p.range.map((r) => r["@id"])) : true))
}

export async function getAllComments(types: string[]): Promise<SlimClass[]> {
    const result: SlimClass[] = []
    for (const id of types) {
        const node = await schemaGraph.getNode(id)
        if (node) {
            result.push({
                "@id": node["@id"],
                comment: node.comment
            })
        }
    }
    return result
}

export function getWorkerStatus() {
    const workerActive =
        typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope

    return { workerActive, schemaStatus: schemaGraph.getSchemaStatus() }
}

export function updateRegisteredSchemas(state: SchemaResolverStore["registeredSchemas"]) {
    schemaResolver.updateRegisteredSchemas(state)
}

export function forceSchemaLoad(schemaId: string) {
    return schemaGraph.forceSchemaLoad(schemaId)
}

export const schemaWorkerFunctions = {
    getAllClasses,
    getPropertyRange,
    getPropertyDomain,
    getPropertyComment,
    getAllComments,
    getAllProperties,
    getPossibleEntityProperties,
    getWorkerStatus,
    updateRegisteredSchemas,
    forceSchemaLoad
}
