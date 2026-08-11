import { IProfileFactoryStrategy } from "@/lib/core/profiles/IProfileFactoryStrategy"
import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"
import { propertyValue } from "@/lib/property-value-utils"
import { MASPProfileHandler } from "@/lib/core/profiles/impl/masp/MASPProfileHandler"
import { PROFILE_CRATE_SCHEMA_RESOURCE } from "@/lib/constants"
import { GenericStrategy } from "@/lib/core/profiles/impl/generic/GenericStrategy"
import { SynchronizedContextService } from "@/lib/core/impl/SynchronizedContextService"

export class MASPStrategy extends GenericStrategy implements IProfileFactoryStrategy {
    name = "MASP"

    async isApplicable(profileCrate: ICrate): Promise<boolean> {
        // TODO: Should also check whether the profile conforms to the MASP Profile (once it is officially released with a PID)
        const { maspSchema } = this.findRootAndMASPSchemaEntities(profileCrate)

        return !!(maspSchema && maspSchema.hasPart && !propertyValue(maspSchema.hasPart).isEmpty())
    }

    async createProfileFromProfileCrate(
        profileUri: string,
        profileCrate: ICrate
    ): Promise<IProfileHandler> {
        const { root, maspSchema } = this.findRootAndMASPSchemaEntities(profileCrate)

        if (!maspSchema) {
            throw new Error("Could not find a schema definition in MASP format")
        }

        const schemaEntities = profileCrate["@graph"].filter((entity) => {
            return propertyValue(maspSchema.hasPart).contains({ "@id": entity["@id"] })
        })

        const resolver = await SynchronizedContextService.newInstance(profileCrate["@context"])
        return new MASPProfileHandler(profileUri, root, schemaEntities, resolver)
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
