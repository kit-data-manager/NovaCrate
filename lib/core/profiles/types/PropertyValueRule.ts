/**
 * Defines the expected value of a property, induced by a profile. If this is included in the rangeIncludes of the
 * property, then its cardinality constraints must be met.
 */
export type PropertyValueRule = {
    /**
     * Internal identifier of this profile property rule.
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
     * Human-readable name of the property value.
     */
    name?: string

    /**
     * Human-readable description of the property value.
     */
    description?: string

    /**
     * Number of times this property must be used on each applicable property. (defined by {@link PropertyRule.rangeIncludes})
     */
    minCount?: number

    /**
     * Number of times this property must be used on each applicable property. (defined by {@link PropertyRule.rangeIncludes})
     */
    maxCount?: number

    /**
     * The anticipated value of the property.
     */
    value: string | IReference
}
