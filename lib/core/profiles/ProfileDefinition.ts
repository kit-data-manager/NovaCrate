import { RO_CRATE_VERSION } from "@/lib/constants"
import { ProfileClass } from "@/lib/core/profiles/ProfileClass"
import { ProfileProperty } from "@/lib/core/profiles/ProfileProperty"

/**
 * This type describes the shape of a profile definition within NovaCrate. All profiles
 * are parsed into this format for use within the editor. This interface is strongly inspired by RO-Crate MASP,
 * which is the profile definition schema set for adoption in a future RO-Crate version.
 */
export type ProfileDefinition = {
    "@id": string
    name: string
    description?: string
    specification: RO_CRATE_VERSION
    version?: string
    classes: ProfileClass[]
    properties: ProfileProperty[]
}
