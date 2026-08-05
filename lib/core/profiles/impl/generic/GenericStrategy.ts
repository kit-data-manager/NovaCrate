import { IProfileFactoryStrategy } from "@/lib/core/profiles/IProfileFactoryStrategy"
import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"
import { getRootEntityID } from "@/lib/utils"
import { propertyValue } from "@/lib/property-value-utils"
import { GenericProfileHandler } from "@/lib/core/profiles/impl/generic/GenericProfileHandler"
import { IMetadataService } from "@/lib/core/IMetadataService"

/**
 * Fallback strategy for profiles that don't have a dedicated strategy.
 */
export class GenericStrategy implements IProfileFactoryStrategy {
    name = "Generic"

    isApplicable(_: ICrate): boolean {
        return true
    }

    async createProfileFromProfileCrate(
        profileUri: string,
        profileCrate: ICrate,
        metadataService: IMetadataService
    ): Promise<IProfileHandler> {
        const root = this.findRoot(profileCrate)

        return new GenericProfileHandler(profileUri, root, metadataService)
    }

    protected findRoot(profileCrate: ICrate) {
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

        return root
    }
}
