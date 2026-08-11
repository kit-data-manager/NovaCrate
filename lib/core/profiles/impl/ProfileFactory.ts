import { CrateSchema, hasAtLeastOneValue, pickFirst } from "@/lib/utils"
import { SynchronizedContextService } from "@/lib/core/impl/SynchronizedContextService"
import { RO_CRATE_VERSION } from "@/lib/constants"
import { ProfileDefinition } from "@/lib/core/profiles/types/ProfileDefinition"
import { IProfileFactoryStrategy } from "@/lib/core/profiles/IProfileFactoryStrategy"
import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"
import { MASPStrategy } from "@/lib/core/profiles/impl/masp/MASPStrategy"
import { GenericStrategy } from "@/lib/core/profiles/impl/generic/GenericStrategy"
import { ProfileHandlerError } from "@/lib/core/profiles/impl/ProfileHandlerError"
import { NoOpReadOnlyFileService } from "@/lib/core/profiles/impl/NoOpReadOnlyFileService"
import { CrateResolver, CrateResolverOptions } from "@/lib/core/profiles/impl/CrateResolver"
import { IReadOnlyFileService } from "@/lib/core/persistence/IReadOnlyFileService"

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
    private readonly resolverOptions: CrateResolverOptions

    constructor(resolverOptions: CrateResolverOptions = {}) {
        this.resolverOptions = resolverOptions
    }

    /**
     * Attempts to create a profile from the given profile URI. If the provided profileURI is known, the corresponding profile
     * metadata is loaded and passed to the configured strategy. If the profileURI (or strategy) is not known, all applicable strategies are
     * tried in order. If no strategy succeeds, an error is thrown.
     * @param profileURI
     */
    async createProfileFromURI(profileURI: string) {
        const known = KNOWN_PROFILES.find((p) => p.uri === profileURI)

        let profileMetadata: ICrate
        let profileCrateFiles: IReadOnlyFileService = new NoOpReadOnlyFileService()
        if (known) {
            try {
                profileMetadata = await known.loadProfile()
            } catch (e) {
                throw new ProfileHandlerError(`Failed to load known profile ${profileURI}`, {
                    cause: e,
                    profileUri: profileURI
                })
            }
        } else {
            // TODO Resolve external profile crate
            throw new ProfileHandlerError(
                `Unknown profile URI: ${profileURI}. Unknown profiles are not supported yet`,
                { profileUri: profileURI }
            )
        }

        function tryIsApplicable(strategy: IProfileFactoryStrategy): boolean {
            try {
                return strategy.isApplicable(profileMetadata, profileCrateFiles)
            } catch (e) {
                console.error(
                    `Profile factory strategy ${strategy.name} threw unexpectedly in the isApplicable method`,
                    e
                )
                return false
            }
        }

        const strategies =
            known && known.strategy
                ? [known.strategy]
                : STRATEGIES.filter((s) => tryIsApplicable(s))

        let result: IProfileHandler | undefined = undefined
        for (const strategy of strategies) {
            if (result) break
            try {
                result = await strategy.createProfileFromProfileCrate(
                    profileURI,
                    profileMetadata,
                    profileCrateFiles
                )
            } catch (e) {
                console.warn(`Failed to create profile with strategy "${strategy.name}"`, e)
            }
        }

        if (!result) {
            throw new ProfileHandlerError(
                `Could not create profile from metadata, no strategy matched/successful`,
                { profileUri: profileURI }
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
