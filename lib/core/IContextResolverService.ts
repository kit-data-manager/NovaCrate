/**
 * Read-only view of the active `@context` that translates between short-form
 * term names and their full URIs.
 */
export interface IContextResolverService {
    /**
     * Resolves an entity type or property in the current context
     * Returns null on failure
     * @param id Entity type of property name (e.g. "Organization", "follows", ...)
     * @returns Full ID of the specified ID (e.g. "Organization" becomes "https://schema.org/Organization"). Can be used to query the SchemaGraph. Returns null on failure
     */
    resolve(id: string): string | null

    /**
     * This method effectively shortens the given URI using the @context of the crate.
     * It is the reverse operation of {@link CrateContext.resolve}.
     * @example
     * reverse("https://schema.org/Organization") -> "Organization"
     * reverse("https://myCustomUrl.org/v1/myProperty") -> "custom:myProperty" // when custom: "https://myCustomUrl.org/v1/" is defined in the context
     * @param url
     */
    reverse(url: string): string | null
}
