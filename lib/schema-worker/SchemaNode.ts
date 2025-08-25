import { toArray } from "../utils"

/**
 * Generic schema node from Schema.org or BioSchemas etc. For easier handling, should be used to
 * construct a {@link SchemaNode}
 */
export interface ISchemaNode {
    "@id": string
    "@type": string | string[]
    "rdfs:comment"?: string | { "@language": string; "@value": string }
    "rdfs:label"?: string | { "@language": string; "@value": string }
    "skos:definition"?: string | { "@language": string; "@value": string }
    "skos:note"?: string | { "@language": string; "@value": string }
    "rdfs:subClassOf"?: IReference | IReference[]
    "rdfs:subPropertyOf"?: IReference | IReference[]
    $validation?: {
        definitions?: Record<string, ISchemaNode>
        required?: string[]
        optional?: string[]
        recommended?: string[]
    }
    [key: string]: unknown
    [key: `${string}:${"rangeIncludes" | "domainIncludes" | "range" | "domain"}`]:
        | IReference
        | IReference[]
        | undefined
}

/**
 * Represents an entry in the @graph array of a JSON-LD schema file used in the context of a RO-Crates.
 * Provides many helper methods and properties to make working with the SchemaNode easier.
 */
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
        return this.node["rdfs:comment"] ?? this.node["skos:definition"] ?? this.node["skos:note"]
    }

    get domain() {
        const key = Object.keys(this.node).find((key) => key.endsWith(":domainIncludes")) as
            | `${string}:${"domainIncludes"}`
            | undefined
        const keyFallback = Object.keys(this.node).find((key) =>
            key.endsWith(":domain")
        ) as `${string}:${"domain"}`
        if (key ?? keyFallback) {
            return this.node[key ?? keyFallback]
        } else {
            return undefined
        }
    }

    get range() {
        const key = Object.keys(this.node).find((key) => key.endsWith(":rangeIncludes")) as
            | `${string}:${"rangeIncludes"}`
            | undefined
        const keyFallback = Object.keys(this.node).find((key) =>
            key.endsWith(":range")
        ) as `${string}:${"range"}`
        if (key || keyFallback) {
            return this.node[key || keyFallback]
        } else {
            return undefined
        }
    }

    isProperty() {
        return toArray(this.node["@type"]).includes(
            "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"
        )
    }

    isClass() {
        return toArray(this.node["@type"]).includes("http://www.w3.org/2000/01/rdf-schema#Class")
    }

    isDirectPropertyOfClass(classId: string) {
        if (!this.domain) return false

        if (Array.isArray(this.domain)) {
            return this.domain.map((ref) => ref["@id"]).includes(classId)
        } else {
            return this.domain["@id"] === classId
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

    /**
     * Create a new SchemaNode and expand all compact IRIs anywhere in the SchemaNode using the context of the schema file. ⚠ Property names are not changed.
     * @param node SchemaNode from a schema file
     * @param context Context of the schema file
     */
    static createWithContext(node: ISchemaNode, context: Map<string, string>) {
        if (!node || typeof node !== "object") {
            throw new Error(`invalid node of type ${typeof node} in SchemaNode.createWithContext`)
        }
        if (!context) {
            throw new Error(
                `invalid context of type ${typeof context} in SchemaNode.createWithContext`
            )
        }

        function handleString(str: string): string {
            const match = /^([a-z0-9]+):.+$/.exec(str)
            if (match != null) {
                const replaceWith = context.get(match[1])
                if (replaceWith) {
                    return str.replace(match[1] + ":", replaceWith)
                } else {
                    return str
                }
            } else {
                return str
            }
        }

        function handleEntry(value: unknown): unknown {
            if (typeof value === "string") {
                return handleString(value)
            } else if (Array.isArray(value)) {
                return value.map(handleEntry)
            } else if (typeof value === "object" && value !== null) {
                return handleObject(value as { [index: string]: unknown })
            } else {
                return value
            }
        }

        function handleObject(obj: { [key: string]: unknown }) {
            for (const [key, value] of Object.entries(obj)) {
                obj[key] = handleEntry(value)
            }
            return obj
        }

        const handled = handleObject(structuredClone(node))
        return new SchemaNode(handled as ISchemaNode)
    }
}
