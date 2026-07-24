import { CrateSchema, pickFirst } from "@/lib/utils"
import { ContextServiceImpl } from "@/lib/core/impl/ContextServiceImpl"
import { RO_CRATE_VERSION } from "@/lib/constants"
import { ProfileDefinition } from "@/lib/core/profiles/types/ProfileDefinition"
import { IProfileFactoryStrategy } from "@/lib/core/profiles/IProfileFactoryStrategy"
import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"
import { MASPStrategy } from "@/lib/core/profiles/impl/masp/MASPStrategy"
import { GenericStrategy } from "@/lib/core/profiles/impl/generic/GenericStrategy"
import { IMetadataService } from "@/lib/core/IMetadataService"

const KNOWN_PROFILES: {
    uri: string
    loadProfile: () => Promise<ICrate>
    strategy?: IProfileFactoryStrategy
}[] = [
    {
        uri: "https://w3id.org/workflowhub/workflow-ro-crate/",
        async loadProfile() {
            const crate = await import("./assets/workflow-1.0.json")
            return CrateSchema.parse(crate)
        },
        strategy: new MASPStrategy()
    },
    {
        uri: "https://w3id.org/workflowhub/workflow-ro-crate/1.0",
        async loadProfile() {
            const crate = await import("./assets/workflow-1.0.json")
            return CrateSchema.parse(crate)
        },
        strategy: new MASPStrategy()
    }
]

const STRATEGIES: IProfileFactoryStrategy[] = [new MASPStrategy(), new GenericStrategy()]

/**
 * Strategy-driven factory for creating profiles from profile URIs. To add more strategies, implement {@link IProfileFactoryStrategy}
 * add the implementation to the `STRATEGIES` array.
 */
export class ProfileFactory {
    /**
     * Attempts to create a profile from the given profile URI. If the provided profileURI is known, the corresponding profile
     * metadata is loaded and passed to the configured strategy. If the profileURI (or strategy) is not known, all applicable strategies are
     * tried in order. If no strategy succeeds, an error is thrown.
     * @param profileURI
     * @param metadataService
     */
    async createProfileFromURI(profileURI: string, metadataService: IMetadataService) {
        const known = KNOWN_PROFILES.find((p) => p.uri === profileURI)

        let profileMetadata: ICrate
        if (known) {
            try {
                profileMetadata = await known.loadProfile()
            } catch (e) {
                throw new Error(`Failed to load known profile ${profileURI}`, { cause: e })
            }
        } else {
            // TODO Resolve external profile crate
            throw new Error(
                `Unknown profile URI: ${profileURI}. Unknown profiles are not supported yet`
            )
        }

        const strategies =
            known && known.strategy
                ? [known.strategy]
                : STRATEGIES.filter((s) => s.isApplicable(profileMetadata))

        let result: IProfileHandler | undefined = undefined
        for (const strategy of strategies) {
            if (result) break
            try {
                result = await strategy.createProfileFromProfileCrate(
                    profileMetadata,
                    metadataService
                )
            } catch (e) {
                console.warn(`Failed to create profile with strategy "${strategy.name}"`, e)
            }
        }

        if (!result) {
            throw new Error(
                `Could not create profile from metadata, no strategy matched/successful`
            )
        }

        return result
    }
}

/**
 * Utility to build a {@link ProfileDefinition} from a root entity. Likely useful for all profile factory strategies. `classes` and `properties` are empty and must be filled by the strategy.
 * @param rootEntity Root entity of the profile crate
 * @param handlerId ID of the profile handler that will be used to handle this profile.
 */
export function buildProfileDefinitionFromRootEntity(
    rootEntity: IEntity,
    handlerId: string
): ProfileDefinition {
    const name = pickFirst(rootEntity.name)
    const isProfileOf = pickFirst(rootEntity.isProfileOf)
    const version = pickFirst(rootEntity.version)
    const description = pickFirst(rootEntity.description)

    return {
        "@id": rootEntity["@id"],
        onHandler: handlerId,
        name: typeof name === "string" ? name : "Unnamed",
        specification:
            typeof isProfileOf !== "string"
                ? (ContextServiceImpl.getKnownContext(isProfileOf["@id"])?.version ??
                  RO_CRATE_VERSION.V1_1_3)
                : RO_CRATE_VERSION.V1_1_3,
        version: typeof version === "string" ? version : undefined,
        description: typeof description === "string" ? description : undefined,
        classes: [],
        properties: [],
        propertyValues: []
    }
}
