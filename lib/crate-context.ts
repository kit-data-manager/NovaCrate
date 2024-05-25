import Context_1_1 from "./crate-verify/assets/context-1.1.json"

const KNOWN_CONTEXTS = [Context_1_1]

/**
 * Provides an easy interface into the crate context for id resolution
 * **Note**: When the context changes, for example when a new key-value pair is added, the context
 * should be reconstructed. This class does not update the crate data in any way
 * @example resolve("Organization") -> "https://schema.org/Organization"
 */
export class CrateContext {
    readonly context: Record<string, string> = {}
    readonly specification: string = "unknown"
    readonly raw: CrateContextType

    constructor(crateContext: CrateContextType) {
        this.raw = crateContext

        const content = Array.isArray(crateContext) ? crateContext : [crateContext]

        for (const entry of content) {
            if (typeof entry === "string") {
                const known = CrateContext.getKnownContext(entry)
                if (known) {
                    this.specification = known.name[0] + known.version
                    this.context = { ...this.context, ...known["@context"] }
                } else console.warn("Failed to parse context entry " + entry)
            } else {
                for (const [key, value] of Object.entries(entry)) {
                    if (key === "@vocab") {
                        const known = CrateContext.getKnownContext(value)
                        if (known) {
                            this.specification = known.name[0] + known.version
                            this.context = { ...this.context, ...known["@context"] }
                        } else console.warn("Failed to parse context @vocab entry " + value)
                    } else {
                        this.context[key] = value
                    }
                }
            }
        }
    }

    static getKnownContext(id: string) {
        for (const knownContext of KNOWN_CONTEXTS) {
            if (knownContext["@id"] === id) return knownContext
        }
        return undefined
    }

    /**
     * Resolves an entity type or property in the current context
     * Returns null on failure
     * @param id Entity type of property name (e.g. "Organization", "follows", ...)
     * @returns Full ID of the specified ID (e.g. "Organization" becomes "https://schema.org/Organization"). Can be used to query the SchemaGraph. Returns null on failure
     */
    resolve(id: string) {
        if (id in this.context) {
            return this.context[id]
        } else return null
    }

    reverse(URI: string) {
        for (const [key, value] of Object.entries(this.context)) {
            if (URI === value) {
                return key
            }
        }

        return null
    }

    /**
     * Returns an array of all classes in the context, determined by their name. Names for classes must
     * be capitalized or start with a number.
     * @returns An array of class URLs
     */
    getAllClasses() {
        const result = new Set<string>()
        Object.entries(this.context)
            .filter(([key, _]) => key.match(/^[A-Z0-9]/))
            .forEach(([_, url]) => {
                result.add(url)
            })

        return Array.from(result.values())
    }
}
