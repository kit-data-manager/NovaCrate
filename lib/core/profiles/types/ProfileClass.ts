/**
 * Defines the structure of a profile class. A profile class defines a class that can (and often must) be used in a crate.
 * - It may be used to associate a description with an existing class or give it a more specific name.
 * - It may be used to associate min/max counts.
 * - It may be used to define a new profile-specific class not present in the base schema or other vocabularies.
 */
export type ProfileClass = {
    /**
     * Internal identifier of this profile class
     */
    "@id": string

    /**
     * A set of classes from the base schema or other vocabulary that this profile class is a specialization of.
     * When specified, this class constrains all entities that have at leat all classes in the list as a type.
     * It should be a full term URI.
     */
    specializationOf?: IReference[]

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
     * Number of times this class must be used in a crate.
     */
    minCount?: number

    /**
     * Maximum number of times this class can be used in a crate.
     */
    maxCount?: number
}
