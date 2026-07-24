import { RO_CRATE_VERSION } from "@/lib/constants"
import { ProfileClass } from "@/lib/core/profiles/types/ProfileClass"
import { ProfileProperty } from "@/lib/core/profiles/types/ProfileProperty"
import { ProfilePropertyValue } from "@/lib/core/profiles/types/ProfilePropertyValue"

/**
 * This type describes the shape of a profile definition within NovaCrate. All profiles
 * are parsed into this format for use within the editor. This interface is strongly inspired by RO-Crate MASP,
 * which is the profile definition schema set for adoption in a future RO-Crate version.
 */
export type ProfileDefinition = {
    /**
     * The internal identifier of this profile definition.
     */
    "@id": string

    /**
     * Identifier of the profile handler this profile definition belongs to.
     */
    onHandler: string

    /**
     * The user-readable name of the profile
     */
    name: string

    /**
     * The user-readable description of the profile.
     */
    description?: string

    /**
     * The version of the RO-Crate schema that this profile suggests
     */
    specification: RO_CRATE_VERSION

    /**
     * The version of the profile definition
     */
    version?: string

    /**
     * Classes, properties and property values that are defined in this profile.
     */

    classes: ProfileClass[]
    properties: ProfileProperty[]
    propertyValues: ProfilePropertyValue[]
}
