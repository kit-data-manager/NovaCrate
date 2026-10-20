import { hasAtLeastOneValue, pickFirst } from "@/lib/utils"
import { SynchronizedContextService } from "@/lib/core/impl/SynchronizedContextService"
import { RO_CRATE_VERSION } from "@/lib/constants"
import { ProfileDefinition } from "@/lib/core/profiles/types/ProfileDefinition"

/**
 * Utility to build a {@link ProfileDefinition} from a root entity. Likely useful for all profile factory strategies. `classes` and `properties` are empty and must be filled by the strategy.
 * @param rootEntity Root entity of the profile crate
 * @param handlerId ID of the profile handler that will be used to handle this profile.
 */
export function buildProfileDefinitionFromRootEntity(
    rootEntity: IEntity,
    handlerId: string
): ProfileDefinition {
    const name = hasAtLeastOneValue(rootEntity.name) ? pickFirst(rootEntity.name) : undefined
    const isProfileOf = hasAtLeastOneValue(rootEntity.isProfileOf)
        ? pickFirst(rootEntity.isProfileOf)
        : undefined
    const version = hasAtLeastOneValue(rootEntity.version)
        ? pickFirst(rootEntity.version)
        : undefined
    const description = hasAtLeastOneValue(rootEntity.description)
        ? pickFirst(rootEntity.description)
        : undefined

    return {
        "@id": rootEntity["@id"],
        onHandler: handlerId,
        name: typeof name === "string" ? name : "Unnamed",
        specification:
            typeof isProfileOf !== "string" && isProfileOf !== undefined
                ? (SynchronizedContextService.getKnownContext(isProfileOf["@id"])?.version ??
                  RO_CRATE_VERSION.V1_1_3)
                : RO_CRATE_VERSION.V1_1_3,
        version: typeof version === "string" ? version : undefined,
        description: typeof description === "string" ? description : undefined,
        entityRules: [],
        propertyRules: [],
        propertyValueRules: []
    }
}
