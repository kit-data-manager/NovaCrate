"use client"

import SchemaOrg from "./assets/schemaorg-current-https.json"
import { toArray } from "../utils"

// TODO currently only works on rdf:Property and rdfs:Class but not on class/property instances

/**
 * Generic schema node from Schema.org or BioSchemas etc.
 */
interface ISchemaNode {
    "@id": string
    "@type": string | string[]
    "rdfs:comment"?: string | { "@language": string; "@value": string }
    "rdfs:label"?: string | { "@language": string; "@value": string }
    "rdfs:subClassOf"?: IReference | IReference[]
    "rdfs:subPropertyOf"?: IReference | IReference[]
    "schema:domainIncludes"?: IReference | IReference[]
    "schema:rangeIncludes"?: IReference | IReference[]
    $validation?: unknown // For validation with AJV outside of schema graph
}

export class SchemaNode {
    private readonly node: ISchemaNode

    constructor(node: ISchemaNode) {
        this.node = node
    }

    get "@id"() {
        return this.node["@id"]
    }

    get parentClass() {
        return this.node["rdfs:subClassOf"]
    }

    get parentProperty() {
        return this.node["rdfs:subPropertyOf"]
    }

    get comment() {
        return this.node["rdfs:comment"]
    }

    get domain() {
        return this.node["schema:domainIncludes"]
    }

    get range() {
        return this.node["schema:rangeIncludes"]
    }

    isProperty() {
        return this.node["@type"] === "rdf:Property"
    }

    isClass() {
        return toArray(this.node["@type"]).includes("rdfs:Class")
    }

    isDirectPropertyOfClass(classId: string) {
        if (!this.node["schema:domainIncludes"]) return false

        if (Array.isArray(this.node["schema:domainIncludes"])) {
            return this.node["schema:domainIncludes"].map((ref) => ref["@id"]).includes(classId)
        } else {
            return this.node["schema:domainIncludes"]["@id"] === classId
        }
    }

    isDirectSubClassOf(classId: string) {
        if (!this.parentClass) return false

        if (Array.isArray(this.parentClass)) {
            return this.parentClass.map((ref) => ref["@id"]).includes(classId)
        } else {
            return this.parentClass["@id"] === classId
        }
    }

    isDirectSubPropertyOf(propertyId: string) {
        if (!this.parentProperty) return false

        if (Array.isArray(this.parentProperty)) {
            return this.parentProperty.map((ref) => ref["@id"]).includes(propertyId)
        } else {
            return this.parentProperty["@id"] === propertyId
        }
    }
}

export class SchemaGraph {
    private context: Map<string, string> = new Map<string, string>()
    private graph: Map<string, SchemaNode> = new Map<string, SchemaNode>()

    getNode(id: string) {
        // Should in the future be replaced with a more robust implementation that actually
        // takes the @context of schema.org (or any other) into account

        if (id.startsWith("https://schema.org/")) {
            id = id.replace("https://schema.org/", "schema:")
        }
        if (id.startsWith("https://bioschemas.org/")) {
            throw "Missing schema for bioschemas.org"
        }
        if (id.startsWith("http://purl.org/")) {
            throw "Missing schema for purl.org"
        }
        if (id.startsWith("http://www.w3.org/")) {
            throw "Missing schema for www.w3.org"
        }
        if (/https?:\/\//.test(id)) {
            throw "Unrecognized schema " + id
        }

        return this.graph.get(id)
    }

    getClassSpecificProperties(classId: string) {
        const self = this.getNode(classId)
        if (!self) throw new ReferenceError("classId not specified or invalid")

        const nodes: SchemaNode[] = []
        for (const [_, node] of this.graph.entries()) {
            if (node.isProperty() && node.isDirectPropertyOfClass(self["@id"])) {
                nodes.push(node)
            }
        }
        return nodes
    }

    getClassProperties(classId: string) {
        const self = this.getNode(classId)
        if (!self) throw new ReferenceError("classId not specified or invalid")
        const parents = this.getClassParents(self["@id"])
        let properties: Set<SchemaNode> = new Set<SchemaNode>()
        for (const nodeId of [...parents, self["@id"]]) {
            const props = this.getClassSpecificProperties(nodeId)
            for (const prop of props) {
                properties.add(prop)
            }
        }
        return Array.from(properties)
    }

    getClassParents(classId: string) {
        let parentIds: string[] = []
        const self = this.getNode(classId)
        if (!self) throw new ReferenceError("classId not specified or invalid")
        if (!self.isClass()) throw new Error("Node is not a class")

        if (self.parentClass) {
            if (Array.isArray(self.parentClass)) {
                for (const entry of self.parentClass) {
                    parentIds.push(entry["@id"])
                    parentIds = parentIds.concat(this.getClassParents(entry["@id"]))
                }
            } else {
                parentIds.push(self.parentClass["@id"])
                parentIds = parentIds.concat(this.getClassParents(self.parentClass["@id"]))
            }
        }

        return parentIds
    }

    getPropertyParents(propertyId: string) {
        let parentIds: string[] = []
        const self = this.getNode(propertyId)
        if (!self) throw new ReferenceError("propertyId not specified or invalid")
        if (!self.isProperty()) throw new Error("Node is not a property")

        if (self.parentProperty) {
            if (Array.isArray(self.parentProperty)) {
                for (const entry of self.parentProperty) {
                    parentIds.push(entry["@id"])
                    parentIds = parentIds.concat(this.getPropertyParents(entry["@id"]))
                }
            } else {
                parentIds.push(self.parentProperty["@id"])
                parentIds = parentIds.concat(this.getPropertyParents(self.parentProperty["@id"]))
            }
        }

        return parentIds
    }

    getSubClasses(classId: string) {
        let childrenIds: Set<string> = new Set<string>()
        const self = this.getNode(classId)
        if (!self) throw new ReferenceError("classId not specified or invalid")
        if (!self.isClass()) throw new Error(`Node ${self["@id"]} is not a class`)

        for (const [_, node] of this.graph.entries()) {
            if (node.isClass() && node.isDirectSubClassOf(self["@id"])) {
                childrenIds.add(node["@id"])
                const subChildren = this.getSubClasses(node["@id"])
                for (const child of subChildren) {
                    childrenIds.add(child)
                }
            }
        }

        return Array.from(childrenIds)
    }

    getSubProperties(propertyId: string) {
        let childrenIds: Set<string> = new Set<string>()
        const self = this.getNode(propertyId)
        if (!self) throw new ReferenceError("propertyId not specified or invalid")
        if (!self.isProperty()) throw new Error("Node is not a property")

        for (const [_, node] of this.graph.entries()) {
            if (node.isProperty() && node.isDirectSubPropertyOf(self["@id"])) {
                childrenIds.add(node["@id"])
                const subChildren = this.getSubProperties(node["@id"])
                for (const child of subChildren) {
                    childrenIds.add(child)
                }
            }
        }

        return Array.from(childrenIds)
    }

    isPropertyOfClass(propertyId: string, classId: string) {
        const property = this.getNode(propertyId)
        if (!property) throw new ReferenceError("propertyId is not specified or invalid")
        const classProperties = this.getClassProperties(classId)
        const propertyParents = this.getPropertyParents(propertyId)
        propertyParents.push(property["@id"])

        for (const property of classProperties) {
            if (propertyParents.includes(property["@id"])) {
                return true
            }
        }

        return false
    }

    addSchemaFromFile(schema: typeof SchemaOrg) {
        if ("@graph" in schema) {
            for (const node of schema["@graph"]) {
                this.addNode(new SchemaNode(node))
            }
        }
        if ("@context" in schema) {
            for (const [key, value] of Object.entries(schema["@context"])) {
                this.context.set(key, value)
            }
        }
    }

    addSchemaOrgSchema() {
        return this.addSchemaFromFile(SchemaOrg)
    }

    addNode(entry: SchemaNode) {
        this.graph.set(entry["@id"], entry)
    }

    expandIRI(IRI: string) {
        const parts = IRI.split(":")
        const match = this.context.get(parts[0])
        if (match) {
            return match + parts[1]
        } else return parts[1]
    }
}

export const schemaGraph = new SchemaGraph()
schemaGraph.addSchemaOrgSchema() // TODO properly implement
