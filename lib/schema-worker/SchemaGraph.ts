"use client"

import { SchemaNode } from "./SchemaNode"
import { SchemaResolver } from "./SchemaResolver"
import { SchemaFile } from "./types"

// ! currently only works on rdf:Property and rdfs:Class but not on class/property instances

export interface LoadedSchemaInfos {
    contextEntries: number
    nodes: number
}

export class SchemaGraph {
    private context: Map<string, string> = new Map<string, string>()
    private graph: Map<string, SchemaNode> = new Map<string, SchemaNode>()

    // Source maps for removing schema elements from the graph without resetting it completely.
    // Maps schema id to context keys.
    private contextEntrySourceMap: Map<string, string[]> = new Map<string, string[]>()
    // Source maps for removing schema elements from the graph without resetting it completely.
    // Maps schema id to node ids.
    private graphNodeSourceMap: Map<string, string[]> = new Map<string, string[]>()

    private loadedSchemas: Map<string, LoadedSchemaInfos> = new Map()
    private schemaIssues: Map<string, unknown> = new Map()

    constructor(private schemaResolver: SchemaResolver) {}

    async getNode(id: string) {
        const firstAttempt = this.graph.get(id)

        if (firstAttempt) {
            return firstAttempt
        } else {
            console.time("getNode-" + id)
            // Try autoloading required schemas to get this node
            console.time("autoload-" + id)
            const result = await this.schemaResolver.autoload(
                id,
                this.getExcludedSchemasForAutoload()
            )
            console.timeEnd("autoload-" + id)

            console.time("addSchema-" + id)
            for (const [key, schema] of result) {
                if (schema.schema) {
                    this.addSchemaFromFile(key, schema.schema)
                } else {
                    console.error("Encountered error while loading schema:", key, schema.error)
                    this.schemaIssues.set(key, schema.error)
                }
            }
            console.timeEnd("addSchema-" + id)

            // If the second attempt fails, return undefined
            console.timeEnd("getNode-" + id)
            return this.graph.get(id)
        }
    }

    /**
     * Exclude all already loaded and all failed schemas from the next autoload
     * @private
     */
    private getExcludedSchemasForAutoload() {
        return [...this.loadedSchemas.keys(), ...this.schemaIssues.keys()]
    }

    async forceSchemaLoad(schemaId: string) {
        try {
            const schema = await this.schemaResolver.forceLoad(schemaId)
            if (schema) this.addSchemaFromFile(schemaId, schema)
        } catch (err) {
            this.schemaIssues.set(schemaId, err)
        }
    }

    getAllNodes() {
        return Array.from(this.graph.values())
    }

    async getClassSpecificProperties(classId: string) {
        const self = await this.getNode(classId)
        if (!self) throw new ReferenceError("classId not specified or invalid")

        const nodes: SchemaNode[] = []
        for (const [, node] of this.graph.entries()) {
            if (node.isProperty() && node.isDirectPropertyOfClass(self["@id"])) {
                nodes.push(node)
            }
        }
        return nodes
    }

    async getClassProperties(classId: string) {
        const self = await this.getNode(classId)
        if (!self) throw new ReferenceError("classId not specified or invalid")
        const parents = await this.getClassParents(self["@id"])
        const properties: Set<SchemaNode> = new Set<SchemaNode>()
        for (const nodeId of [...parents, self["@id"]]) {
            const props = await this.getClassSpecificProperties(nodeId)
            for (const prop of props) {
                properties.add(prop)
            }
        }
        return Array.from(properties)
    }

    async getClassParents(classId: string) {
        let parentIds: string[] = []
        const self = await this.getNode(classId)
        if (!self) throw new ReferenceError("classId not specified or invalid")
        if (!self.isClass()) throw new Error("Node is not a class")

        if (self.parentClass) {
            if (Array.isArray(self.parentClass)) {
                for (const entry of self.parentClass) {
                    parentIds.push(entry["@id"])
                    parentIds = parentIds.concat(await this.getClassParents(entry["@id"]))
                }
            } else {
                parentIds.push(self.parentClass["@id"])
                parentIds = parentIds.concat(await this.getClassParents(self.parentClass["@id"]))
            }
        }

        return parentIds
    }

    async getPropertyParents(propertyId: string) {
        let parentIds: string[] = []
        const self = await this.getNode(propertyId)
        if (!self) throw new ReferenceError("propertyId not specified or invalid")
        if (!self.isProperty()) throw new Error("Node is not a property")

        if (self.parentProperty) {
            if (Array.isArray(self.parentProperty)) {
                for (const entry of self.parentProperty) {
                    parentIds.push(entry["@id"])
                    parentIds = parentIds.concat(await this.getPropertyParents(entry["@id"]))
                }
            } else {
                parentIds.push(self.parentProperty["@id"])
                parentIds = parentIds.concat(
                    await this.getPropertyParents(self.parentProperty["@id"])
                )
            }
        }

        return parentIds
    }

    async getSubClasses(classId: string) {
        const childrenIds: Set<string> = new Set<string>()
        const self = await this.getNode(classId)
        if (!self) throw new ReferenceError("classId not specified or invalid")
        if (!self.isClass()) throw new Error(`Node ${self["@id"]} is not a class`)

        for (const [, node] of this.graph.entries()) {
            if (node.isClass() && node.isDirectSubClassOf(self["@id"])) {
                childrenIds.add(node["@id"])
                const subChildren = await this.getSubClasses(node["@id"])
                for (const child of subChildren) {
                    childrenIds.add(child)
                }
            }
        }

        return Array.from(childrenIds)
    }

    async getSubProperties(propertyId: string) {
        const childrenIds: Set<string> = new Set<string>()
        const self = await this.getNode(propertyId)
        if (!self) throw new ReferenceError("propertyId not specified or invalid")
        if (!self.isProperty()) throw new Error("Node is not a property")

        for (const [, node] of this.graph.entries()) {
            if (node.isProperty() && node.isDirectSubPropertyOf(self["@id"])) {
                childrenIds.add(node["@id"])
                const subChildren = await this.getSubProperties(node["@id"])
                for (const child of subChildren) {
                    childrenIds.add(child)
                }
            }
        }

        return Array.from(childrenIds)
    }

    async isPropertyOfClass(propertyId: string, classId: string) {
        const property = await this.getNode(propertyId)
        if (!property) throw new ReferenceError("propertyId is not specified or invalid")
        const classProperties = await this.getClassProperties(classId)
        const propertyParents = await this.getPropertyParents(propertyId)
        propertyParents.push(property["@id"])

        for (const property of classProperties) {
            if (propertyParents.includes(property["@id"])) {
                return true
            }
        }

        return false
    }

    addSchemaFromFile(id: string, schema: SchemaFile) {
        let loadedContextEntries = 0
        let loadedNodes = 0

        const sourceMapContextValues: string[] = []
        const sourceMapSchemaNodes: string[] = []

        if ("@context" in schema) {
            for (const [key, value] of Object.entries(schema["@context"])) {
                if (typeof value === "string") {
                    this.context.set(key, value)

                    sourceMapContextValues.push(value)
                    loadedContextEntries += 1
                }
            }
        }

        if ("@graph" in schema) {
            for (const node of schema["@graph"]) {
                const schemaNode = SchemaNode.createWithContext(node, this.context)
                this.addNode(schemaNode)

                sourceMapSchemaNodes.push(schemaNode["@id"])
                loadedNodes += 1
            }
        }

        this.loadedSchemas.set(id, {
            contextEntries: loadedContextEntries,
            nodes: loadedNodes
        })
        this.contextEntrySourceMap.set(id, sourceMapContextValues)
        this.graphNodeSourceMap.set(id, sourceMapSchemaNodes)
    }

    unloadSchema(id: string) {
        const contextKeys = this.contextEntrySourceMap.get(id)
        const graphNodeIds = this.graphNodeSourceMap.get(id)

        if (contextKeys) {
            for (const key of contextKeys) {
                this.context.delete(key)
            }
        }

        if (graphNodeIds) {
            for (const nodeId of graphNodeIds) {
                this.graph.delete(nodeId)
            }
        }

        this.loadedSchemas.delete(id)
        this.schemaIssues.delete(id)
    }

    addNode(entry: SchemaNode) {
        this.graph.set(entry["@id"], entry)
    }

    /**
     * For the user interface
     */
    getSchemaStatus() {
        return { loadedSchemas: this.loadedSchemas, schemaIssues: this.schemaIssues }
    }
}

export type SchemaStatus = ReturnType<InstanceType<typeof SchemaGraph>["getSchemaStatus"]>
