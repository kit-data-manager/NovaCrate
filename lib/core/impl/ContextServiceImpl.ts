import { RO_CRATE_VERSION } from "@/lib/constants"
import { IContextService, IContextServiceEvents } from "@/lib/core/IContextService"
import { IContextResolverService } from "@/lib/core/IContextResolverService"
import { Observable } from "@/lib/core/impl/Observable"
import { IObservable } from "@/lib/core/IObservable"
import { IPersistenceAdapter } from "@/lib/core/IPersistenceAdapter"

const KNOWN_CONTEXTS = [
    {
        "@id": "https://w3id.org/ro/crate/1.1/context",
        name: "RO-Crate JSON-LD Context",
        version: RO_CRATE_VERSION.V1_1_3,
        load: () => import("../../schema-worker/assets/context-1.1.json")
    },
    {
        "@id": "https://w3id.org/ro/crate/1.2/context",
        name: "RO-Crate JSON-LD Context",
        version: RO_CRATE_VERSION.V1_2_0,
        load: () => import("../../schema-worker/assets/context-1.2.json")
    }
]

/**
 * Provides an easy interface into the crate context for id resolution
 * **Note**: When the context changes, for example when a new key-value pair is added, the context
 * should be reconstructed. This class does not update the crate data in any way
 * @example resolve("Organization") -> "https://schema.org/Organization"
 */
export class ContextServiceImpl implements IContextService, IContextResolverService {
    private _context: Record<string, string> = {}
    private _contextReversed: Record<string, string> = {}
    private _customPairs: Record<string, string> = {}
    private _specification: RO_CRATE_VERSION | undefined = undefined
    private _usingFallback = false
    private _errors: unknown[] = []
    private raw?: CrateContextType

    constructor(private persistenceAdapter: IPersistenceAdapter) {
        this.update = this.update.bind(this)
        this.persistenceAdapter.events.addEventListener("context-changed", this.update)
    }

    private _events = new Observable<IContextServiceEvents>()
    get events(): IObservable<IContextServiceEvents> {
        return this._events
    }

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

    addCustomContextPair(prefix: string, url: string): void {
        this._customPairs[prefix] = url
    }

    removeCustomContextPair(prefix: string): void {
        delete this._customPairs[prefix]
    }

    private async loadKnownContext(primary: (typeof KNOWN_CONTEXTS)[number]) {
        const known = primary
        const loaded = await known.load()
        return { specification: known.version, data: loaded["@context"] }
    }

    /**
     * Should be called to set the crate context up. Can be called multiple times without
     * creating a new instance.
     * @param crateContext The @context of the crate
     */
    private async update(crateContext: CrateContextType) {
        let tempContext = {}
        let tempCustomPairs: Record<string, string> = {}
        let tempSpecification = undefined
        let tempUsingFallback = false
        let tempErrors = []
        let tempRaw = crateContext

        const content = Array.isArray(crateContext) ? crateContext : [crateContext]
        const fallback = KNOWN_CONTEXTS.find((c) => c.version === RO_CRATE_VERSION.V1_1_3)!

        for (const entry of content) {
            if (typeof entry === "string") {
                const known = ContextServiceImpl.getKnownContext(entry)
                if (known) {
                    const { specification, data } = await this.loadKnownContext(known)
                    tempSpecification = specification
                    tempContext = { ...tempContext, ...data }
                } else {
                    const msg = `Cannot load schema ${entry} without prefix. Please specify the schema as a custom context entry with a prefix.`
                    console.error(msg)
                    tempErrors.push(new Error(msg))
                }
            } else {
                for (const [key, value] of Object.entries(entry)) {
                    if (key === "@vocab") {
                        const known = ContextServiceImpl.getKnownContext(value)
                        if (known) {
                            const { specification, data } = await this.loadKnownContext(known)
                            tempSpecification = specification
                            tempContext = { ...tempContext, ...data }
                        } else {
                            const msg = `Cannot load schema ${value} as @vocab. Only known specifications are supported. Please specify the schema as a custom context entry with a prefix.`
                            console.error(msg)
                            tempErrors.push(new Error(msg))
                        }
                    } else {
                        const temp = this.context
                        temp[key] = value
                        tempContext = temp
                        tempCustomPairs[key] = value
                    }
                }
            }
        }

        if (!tempSpecification) {
            tempUsingFallback = true
            const { specification, data } = await this.loadKnownContext(fallback)
            tempSpecification = specification
            tempContext = { ...tempContext, ...data }

            const msg = `Could not determine the RO-Crate specification version. Using fallback context: ${fallback.version}`
            console.error(msg)
            tempErrors.push(new Error(msg))
        }

        this.context = tempContext
        this._customPairs = tempCustomPairs
        this._specification = tempSpecification
        this._usingFallback = tempUsingFallback
        this._errors = tempErrors
        this.raw = tempRaw
        this._events.emit("context-changed")
    }

    static async newInstance(persistenceAdapter: IPersistenceAdapter, context: CrateContextType) {
        const instance = new ContextServiceImpl(persistenceAdapter)
        await instance.update(context)
        return instance
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
        if (id in this._context) {
            return this._context[id]
        } else if (/^.+:.+$/.test(id)) {
            // Type has a prefix that we will try to resolve
            const prefix = id.split(":")[0]
            const suffix = id.split(":")[1]
            const prefixContext = this._customPairs[prefix] ?? this._context[prefix]
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

    dispose() {
        this.persistenceAdapter.events.removeEventListener("context-changed", this.update)
    }
}
