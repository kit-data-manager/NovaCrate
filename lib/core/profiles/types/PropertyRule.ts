/**
 * Defines constraints for a property. The constraints are introduced by a profile.
 * - It may be used to associate a description with an existing property or give it a more specific name.
 * - It may be used to associate min/max counts.
 * - It may be used to define a new profile-specific property not present in the base schema or other vocabularies.
 * - It may be used to constrain possible values and change the range of classes that can hold this property.
 */
export type PropertyRule = {
    /**
     * Internal identifier of this rule.
     */
    "@id": string

    /**
     * Identifier of the profile handler this rule belongs to.
     */
    onHandler: string

    /**
     * Identifier of the profile this rule belongs to.
     */
    onProfile: string

    /**
     * A property term from base schema or other vocabulary that this profile property is a specialization of.
     * When specified, this rule constrains the specified property. When not specified, this is a property term definition.
     * It should be a full term URI.
     */
    specializationOf?: string

    /**
     * Alternative of the label. Should be the same.
     */
    name?: string

    /**
     * Display name of the property. Must be set. Used as the term for this property.
     */
    label: string

    /**
     * Human-readable description of the property.
     */
    description?: string

    /**
     * Number of times this property must be used on each applicable entity. (defined by {@link appliesToEntityRules})
     */
    minCount?: number

    /**
     * Maximum number of times this property can be used on each applicable entity. (defined by {@link appliesToEntityRules})
     */
    maxCount?: number

    /**
     * List of entities that the property can (or must, depending on {@link minCount}) be used on. Must be set.
     */
    appliesToEntityRules: string[]

    /**
     * References to {@link EntityRule} or {@link PropertyValueRule} that values of this property can be instances of. Is preceded by {@link options}.
     */
    rangeIncludes?: string[]

    /**
     * When set, the value(s) of the property must (each) be one of the options. Takes precedence over {@link rangeIncludes}.
     */
    options?: EntitySinglePropertyTypes[]
}
