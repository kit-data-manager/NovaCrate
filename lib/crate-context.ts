import { RO_CRATE_VERSION } from "@/lib/constants"

const KNOWN_CONTEXTS = [
    {
        "@id": "https://w3id.org/ro/crate/1.1/context",
        name: "RO-Crate JSON-LD Context",
        version: RO_CRATE_VERSION.V1_1_3,
        load: () => import("./schema-worker/assets/context-1.1.json")
    },
    {
        "@id": "https://w3id.org/ro/crate/1.2/context",
        name: "RO-Crate JSON-LD Context",
        version: RO_CRATE_VERSION.V1_2_0,
        load: () => import("./schema-worker/assets/context-1.2.json")
    }
]

/**
 * Provides an easy interface into the crate context for id resolution
 * **Note**: When the context changes, for example when a new key-value pair is added, the context
 * should be reconstructed. This class does not update the crate data in any way
 * @example resolve("Organization") -> "https://schema.org/Organization"
 */
export class CrateContext {
    private _context: Record<string, string> = {}
    private _contextReversed: Record<string, string> = {}
    private _customPairs: Record<string, string> = {}
    private _specification: RO_CRATE_VERSION | undefined = undefined
    private _usingFallback = false
    private _errors: unknown[] = []
    private raw?: CrateContextType

    constructor() {}

    get context() {
        return structuredClone(this._context)
    }

    private set context(value: Record<string, string>) {
        this._context = structuredClone(value)
        this._contextReversed = {}
        for (const [key, value] of Object.entries(this._context)) {
            this._contextReversed[value] = key
        }
    }

    get customPairs() {
        return structuredClone(this._customPairs)
    }

    get specification() {
        return structuredClone(this._specification)
    }

    get usingFallback() {
        return this._usingFallback
    }

    get errors() {
        return structuredClone(this._errors)
    }

    private async loadKnownContext(
        primary: (typeof KNOWN_CONTEXTS)[number] | undefined,
        fallback: (typeof KNOWN_CONTEXTS)[number]
    ) {
        if (!primary) {
            console.warn(
                `Using fallback context ${fallback.version} because the specification of this crate is not supported`
            )
            this._usingFallback = true
        } else {
            this._usingFallback = false
        }
        const known = primary || fallback
        const loaded = await known.load()
        this._specification = known.version
        this.context = { ...this.context, ...loaded["@context"] }
    }

    /**
     * Should be called to set the crate context up. Can be called multiple times without
     * creating a new instance.
     * @param crateContext The @context of the crate
     */
    async setup(crateContext: CrateContextType) {
        this.context = {}
        this._customPairs = {}
        this._specification = undefined
        this._usingFallback = false
        this._errors = []
        this.raw = crateContext

        const content = Array.isArray(crateContext) ? crateContext : [crateContext]
        const fallback = KNOWN_CONTEXTS.find((c) => c.version === RO_CRATE_VERSION.V1_1_3)!

        for (const entry of content) {
            if (typeof entry === "string") {
                const known = CrateContext.getKnownContext(entry)
                if (known) await this.loadKnownContext(known, fallback)
                else {
                    const msg = `Cannot load schema ${entry} without prefix. Please specify the schema as a custom context entry with a prefix.`
                    console.error(msg)
                    this._errors.push(new Error(msg))
                }
            } else {
                for (const [key, value] of Object.entries(entry)) {
                    if (key === "@vocab") {
                        const known = CrateContext.getKnownContext(value)
                        await this.loadKnownContext(known, fallback)
                    } else {
                        const temp = this.context
                        temp[key] = value
                        this.context = temp
                        this._customPairs[key] = value
                    }
                }
            }
        }
    }

    /**
     * Compares the provided crate context with the crate context that was used to set up this instance.
     * The comparison happens using JSON.stringify, which might be unstable.
     * @param crateContext
     */
    isSameAs(crateContext: CrateContextType) {
        return JSON.stringify(this.raw) === JSON.stringify(crateContext)
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
        } else if (/^.+:.+$/.test(id)) {
            // Type has a prefix that we will try to resolve
            const prefix = id.split(":")[0]
            const suffix = id.split(":")[1]
            const prefixContext = this._customPairs[prefix]
            if (prefixContext) {
                return prefixContext + suffix
            } else {
                console.warn(
                    `Found node with id ${id}, but prefix ${prefix} is not defined in the context`
                )
                return null
            }
        } else return null
    }

    /**
     * This method effectively shortens the given URI using the @context of the crate.
     * It is the reverse operation of {@link CrateContext.resolve}.
     * @example
     * reverse("https://schema.org/Organization") -> "Organization"
     * reverse("https://myCustomUrl.org/v1/myProperty") -> "custom:myProperty" // when custom: "https://myCustomUrl.org/v1/" is defined in the context
     * @param URI
     */
    reverse(URI: string) {
        if (this._contextReversed[URI]) return this._contextReversed[URI]
        for (const [key, value] of Object.entries(this._customPairs)) {
            if (URI.startsWith(value)) return key + ":" + URI.substring(value.length)
        }
        return null
    }
}
