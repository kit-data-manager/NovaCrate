/**
 * Defines the structure of a profile class property. A profile class property defines a property that can (and often must) be used in a crate.
 * - It may be used to associate a description with an existing property or give it a more specific name.
 * - It may be used to associate min/max counts.
 * - It may be used to define a new profile-specific property not present in the base schema or other vocabularies.
 * - It may be used to constrain possible values and change the range of classes that can hold this property.
 */
export type ProfileProperty = {
    /**
     * Internal identifier of this profile property.
     */
    "@id": string

    /**
     * A property from base schema or other vocabulary that this profile property is a specialization of.
     * When specified, this property constrains the specified property. When not specified, this is a property term definition.
     */
    specializationOf?: string

    /**
     * Alternative of the label. Should be the same.
     */
    name?: string

    /**
     * Display name of the property. Must be set.
     */
    label: string

    /**
     * Human-readable description of the property.
     */
    description?: string

    /**
     * Number of times this property must be used on each applicable class. (defined by {@link domainIncludes})
     */
    minCount?: number

    /**
     * Maximum number of times this property can be used on each applicable class. (defined by {@link domainIncludes})
     */
    maxCount?: number

    /**
     * List of classes that the property can be used on. Must be set.
     * Overrides domainIncludes of the specialized property.
     */
    domainIncludes: IReference[]

    /**
     * List of classes that values of this property can be instances of. Is preceded by {@link value} and {@link options}.
     * Overrides rangeIncludes of the specialized property when set.
     */
    rangeIncludes?: IReference[]

    /**
     * When set, this must be the value of the property. Takes precedence over {@link options} and {@link rangeIncludes}.
     */
    value?: EntityPropertyTypes

    /**
     * When set, the value(s) of the property must (each) be one of the options. Is preceded by {@link value} and takes precedence over {@link rangeIncludes}.
     */
    options?: EntitySinglePropertyTypes[]
}
