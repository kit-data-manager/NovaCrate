import Context_1_1 from "./assets/context-1.1.json"

/**
 * Provides an easy interface into the crate context for id resolution
 * **Note**: When the context changes, for example when a new key-value pair is added, the context
 * should be reconstructed. This class does not update the crate data in any way
 * @example resolve: Organization -> https://schema.org/Organization
 */
export class Context {
    private readonly context: Record<string, string>

    constructor(crateContext: CrateContext) {
        if (crateContext === Context_1_1["@id"]) {
            this.context = Context_1_1["@context"]
        } else if (
            typeof crateContext === "object" &&
            "@vocab" in crateContext &&
            crateContext["@vocab"] === Context_1_1.url["@id"]
        ) {
            this.context = Context_1_1["@context"]
            Object.entries(crateContext).forEach(([key, value]) => {
                this.context[key] = value
            })
        } else {
            console.error("Unable to parse crate context", crateContext)
            this.context = {}
        }
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
}
