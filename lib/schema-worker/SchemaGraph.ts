"use client"

import { ISchemaNode, SchemaNode } from "./SchemaNode"
import { SchemaResolver } from "./SchemaResolver"
import { SchemaFile } from "./types"

// ! currently only works on rdf:Property and rdfs:Class but not on class/property instances

export class SchemaGraph {
    private graph: Map<string, SchemaNode> = new Map<string, SchemaNode>()

    // Source maps for removing schema elements from the graph without resetting it completely.
    // Maps schema id to node ids.
    private graphNodeSourceMap: Map<string, string[]> = new Map<string, string[]>()

    // Schema ids whose terms have already been merged into the graph, so
    // addSchemaFromFile is only called once per schema id.
    private loadedSchemaIds: Set<string> = new Set()

    constructor(private schemaResolver: SchemaResolver) {}

    async getNode(id: string, abortOnFail: boolean = false): Promise<SchemaNode | undefined> {
        const firstAttempt = this.graph.get(id)

        if (firstAttempt || abortOnFail) {
            return firstAttempt
        } else {
            // Try autoloading required schemas to get this node
            const result = await this.schemaResolver.autoload(id)

            for (const [key, schema] of result) {
                if (schema.schema) {
                    this.addSchemaFromFile(key, schema.schema)
                }
            }

            // If the second attempt fails, return undefined
            return this.getNode(id, true)
        }
    }

    async forceSchemaLoad(schemaId: string) {
        const schema = await this.schemaResolver.forceLoad(schemaId)
        if (schema) this.addSchemaFromFile(schemaId, schema)
    }

    async loadAllSchemas() {
        const results = this.schemaResolver.loadAll()
        for (const result of results) {
            try {
                const data = await result.data
                if (data) this.addSchemaFromFile(result.schema.displayName, data)
            } catch (err) {
                // Fallback path in case the nested promise handling goes wrong
                this.schemaResolver.recordSchemaFailure(result.schema.displayName, err)
            }
        }
    }

    getAllNodes() {
        return Array.from(this.graph.values())
    }

    async getClassSpecificProperties(classId: string) {
        if (!classId) throw new ReferenceError(`classId not specified or invalid: ${classId}`)
        const self = await this.getNode(classId)
        if (!self) {
            console.warn(`class with classId "${classId}" does not exist`)
            return []
        }

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
        if (!self)
            throw new ReferenceError(
                "failed to get class properties, classId not specified or class does not exist"
            )
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
        if (!classId) throw new ReferenceError("classId not specified or invalid")
        const self = await this.getNode(classId)
        if (!self) {
            console.warn(`class with classId "${classId}" does not exist`)
            return []
        }
        if (!self.isClass()) throw new Error(`Node ${classId} is not a class`)

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
        if (!self) throw new ReferenceError(`classId ${classId} not specified or invalid`)
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
        if (this.loadedSchemaIds.has(id)) return
        this.loadedSchemaIds.add(id)

        const sourceMapSchemaNodes: string[] = []
        const context = new Map<string, string>()

        if ("@context" in schema) {
            for (const [key, value] of Object.entries(schema["@context"])) {
                if (typeof value === "string") {
                    context.set(key, value)
                }
            }
        }

        if ("@graph" in schema) {
            for (const node of schema["@graph"]) {
                const schemaNode = SchemaNode.createWithContext(node as ISchemaNode, context)
                this.addNode(schemaNode)

                sourceMapSchemaNodes.push(schemaNode["@id"])
            }
        }

        this.graphNodeSourceMap.set(id, sourceMapSchemaNodes)
    }

    unloadSchema(id: string) {
        const graphNodeIds = this.graphNodeSourceMap.get(id)

        if (graphNodeIds) {
            for (const nodeId of graphNodeIds) {
                this.graph.delete(nodeId)
            }
        }

        this.loadedSchemaIds.delete(id)
        this.schemaResolver.removeSchemaState(id)
    }

    addNode(entry: SchemaNode) {
        this.graph.set(entry["@id"], entry)
    }

    /**
     * For the user interface
     */
    getSchemaStatus() {
        return {
            loadedSchemas: this.schemaResolver.getLoadedSchemaStatus(),
            schemaIssues: this.schemaResolver.getSchemaIssues()
        }
    }
}

export type SchemaStatus = ReturnType<InstanceType<typeof SchemaGraph>["getSchemaStatus"]>
