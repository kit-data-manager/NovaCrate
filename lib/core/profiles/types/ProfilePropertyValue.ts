/**
 * Defines the expected value of a profile property. Can be optional. If this is included in the rangeIncludes of the
 * property, then its cartinality constraints must be met.
 */
export type ProfilePropertyValue = {
    /**
     * Internal identifier of this profile property.
     */
    "@id": string

    /**
     * Identifier of the profile handler this property value belongs to.
     */
    onHandler: string

    /**
     * Identifier of the profile this property value belongs to.
     */
    onProfile: string

    /**
     * Alternative of the label. Should be the same.
     */
    name?: string

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
     * The anticipated value of the property.
     */
    value: string | IReference
}
