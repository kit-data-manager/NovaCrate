/**
 * Defines the structure of an entity within a profile. An entity rule defines an entity that can (and often must) be used in a crate.
 * - It may be used to associate a description with an entity or give it a more specific name.
 * - It may be used to associate min/max counts.
 */
export type EntityRule = {
    /**
     * Internal identifier of this rule
     */
    "@id": string

    /**
     * Identifier of the profile handler this rule belongs to.
     */
    onHandler: string

    /**
     * Identifier of the profile definition this rule belongs to.
     */
    onProfile: string

    /**
     * A set of terms from the base schema or other vocabulary that conforming entities need to have as their @type.
     * Each reference should be a full term URI. Non http links are automatically rewritten to https
     */
    specializationOf?: string[]

    /**
     * Human-readable label
     */
    name?: string

    /**
     * Alternative to name, should be the same
     */
    label?: string

    /**
     * Optional human-readable description
     */
    description?: string

    /**
     * Number of times this entity rule must be used in a crate.
     */
    minCount?: number

    /**
     * Maximum number of times this entity rule can be used in a crate.
     */
    maxCount?: number
}
