import { IProfileFactoryStrategy } from "@/lib/core/profiles/IProfileFactoryStrategy"
import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"
import { propertyValue } from "@/lib/property-value-utils"
import { MASPProfile } from "@/lib/core/profiles/impl/masp/MASPProfile"
import { PROFILE_CRATE_SCHEMA_RESOURCE } from "@/lib/constants"
import { GenericStrategy } from "@/lib/core/profiles/impl/generic/GenericStrategy"
import { IMetadataService } from "@/lib/core/IMetadataService"

export class MASPStrategy extends GenericStrategy implements IProfileFactoryStrategy {
    name = "MASP"

    isApplicable(profileCrate: ICrate): boolean {
        // TODO: Should also check whether the profile conforms to the MASP Profile (once it is officially released with a PID)
        const { maspSchema } = this.findRootAndMASPSchemaEntities(profileCrate)

        return !!(maspSchema && maspSchema.hasPart && !propertyValue(maspSchema.hasPart).isEmpty())
    }

    async createProfileFromProfileCrate(
        profileCrate: ICrate,
        metadataService: IMetadataService
    ): Promise<IProfileHandler> {
        const { root, maspSchema } = this.findRootAndMASPSchemaEntities(profileCrate)

        if (!maspSchema) {
            throw new Error("Could not find a schema definition in MASP format")
        }

        const schemaEntities = profileCrate["@graph"].filter((entity) => {
            return propertyValue(maspSchema.hasPart).contains({ "@id": entity["@id"] })
        })

        return new MASPProfile(root, schemaEntities, metadataService)
    }

    private findRootAndMASPSchemaEntities(profileCrate: ICrate) {
        const root = this.findRoot(profileCrate)

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
