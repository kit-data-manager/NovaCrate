import { IProfileFactoryStrategy } from "@/lib/core/profiles/IProfileFactoryStrategy"
import { IProfile } from "@/lib/core/profiles/IProfile"
import { getRootEntityID } from "@/lib/utils"
import { propertyValue } from "@/lib/property-value-utils"
import { MASPProfile } from "@/lib/core/profiles/impl/masp/MASPProfile"
import { PROFILE_CRATE_SCHEMA_RESOURCE } from "@/lib/constants"

export class MASPStrategy implements IProfileFactoryStrategy {
    name = "MASP"

    isApplicable(profileCrate: ICrate): boolean {
        // TODO: Should also check whether the profile conforms to the MASP Profile (once it is officially released with a PID)
        const { maspSchema } = this.findRootAndMASPSchemaEntities(profileCrate)

        return !!(maspSchema && maspSchema.hasPart && !propertyValue(maspSchema.hasPart).isEmpty())
    }

    async createProfileFromProfileCrate(profileCrate: ICrate): Promise<IProfile> {
        const { root, maspSchema } = this.findRootAndMASPSchemaEntities(profileCrate)

        if (!maspSchema) {
            throw new Error("Could not find a schema definition in MASP format")
        }

        const schemaEntities = profileCrate["@graph"].filter((entity) => {
            return propertyValue(maspSchema.hasPart).contains({ "@id": entity["@id"] })
        })

        return new MASPProfile(root, schemaEntities)
    }

    private findRootAndMASPSchemaEntities(profileCrate: ICrate) {
        const rootID = getRootEntityID(profileCrate["@graph"])
        if (!rootID) {
            throw new Error("Could not determine root entity ID from profile metadata")
        }

        const root = profileCrate["@graph"].find((e) => e["@id"] === rootID)
        if (!root) {
            throw new Error(`Root entity with ID ${rootID} not found in profile metadata`)
        }
        if (!propertyValue(root["@type"]).contains("Profile")) {
            throw new Error(`Root entity is not a Profile: ${rootID}`)
        }

        const resources = profileCrate["@graph"].filter((entity) => {
            return propertyValue(entity["@type"]).contains("ResourceDescriptor") && root.hasResource
                ? propertyValue(root.hasResource).contains({ "@id": entity["@id"] })
                : false
        })

        const schemas = resources.filter(
            (entity) =>
                entity.hasRole &&
                propertyValue(entity.hasRole).contains({ "@id": PROFILE_CRATE_SCHEMA_RESOURCE })
        )

        const maspSchema = schemas.find(
            (entity) => entity.hasPart && !propertyValue(entity.hasPart).isEmpty()
        )

        return { root, maspSchema }
    }
}
