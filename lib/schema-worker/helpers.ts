import { referenceCheck, toArray } from "../utils"
import { SchemaNode } from "./SchemaNode"
import { SchemaGraph } from "./SchemaGraph"
import { SchemaResolver } from "./SchemaResolver"
import { RO_CRATE_VERSION } from "@/lib/constants"
import type { SchemaResolverSettings } from "@/lib/state/schema-resolver-settings"

const schemaResolver = new SchemaResolver({
    knownSchemas: [],
    preloadKnownSchemas: false,
    allowUnknownSchemas: false,
    setKnownSchemas() {},
    setAllowUnknownSchemas() {},
    setPreloadKnownSchemas() {},
    addSchema() {},
    updateSchema() {},
    deleteSchema() {}
})
const schemaGraph = new SchemaGraph(schemaResolver)

/**
 * Get the comment of a known property
 * @param propertyTermURI The full URI to the term of the property, e.g. https://schema.org/author
 */
export async function getPropertyComment(propertyTermURI: string) {
    return (await schemaGraph.getNode(propertyTermURI))?.comment
}

/**
 * Get a list of types (term URIs) that can contain the given property.
 * @param propertyTermURI The full URI to the term of the property, e.g. https://schema.org/author
 */
export async function getPropertyDomain(propertyTermURI: string) {
    const refs = (await schemaGraph.getNode(propertyTermURI))?.domain
    if (!refs) return []

    if (Array.isArray(refs)) {
        return refs
    } else {
        return [refs]
    }
}

/**
 * Slim variant of {@link SchemaNode} for transfer from schema worker to UI.
 */
export interface SlimClass {
    /**
     * Full URI of the node. Within NovaCrate, nodes almost exclusively refer to vocabulary terms.
     * @example https://schema.org/author
     */
    "@id": string

    /**
     * Comment of the node
     */
    comment: SchemaNode["comment"]
}

export async function getPropertyRange(propertyId: string) {
    const node = await schemaGraph.getNode(propertyId)
    let refs = node?.range
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

export async function getAllClasses(): Promise<SlimClass[]> {
    // Ensure the known schemas are loaded before listing classes, so the first
    // request blocks until the vocabulary fetches complete.
    await schemaGraph.loadAllSchemas()
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

export async function getAllProperties(opt?: Partial<PropertyOptions>): Promise<SlimProperty[]> {
    // Ensure the known schemas are loaded before listing properties, so the
    // first request blocks until the vocabulary fetches complete.
    await schemaGraph.loadAllSchemas()
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

export function updateRegisteredSchemas(state: SchemaResolverSettings, spec: RO_CRATE_VERSION) {
    schemaResolver.updateRegisteredSchemas(state, spec)
    if (state.preloadKnownSchemas) {
        schemaGraph.loadAllSchemas().then()
    }
}

export function forceSchemaLoad(schemaId: string) {
    return schemaGraph.forceSchemaLoad(schemaId)
}

export function loadAllSchemas() {
    return schemaGraph.loadAllSchemas()
}

export function unloadSchema(schemaId: string) {
    return schemaGraph.unloadSchema(schemaId)
}

export function getNode(id: string) {
    return schemaGraph.getNode(id)
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
    forceSchemaLoad,
    loadAllSchemas,
    unloadSchema,
    getNode
}
