import { CrateSchema } from "@/lib/utils"
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

/**
 * Returns true if the given profile URI is a bundled profile that is loaded
 * directly and never fetched from the network.
 */
export function isKnownProfileURI(uri: string): boolean {
    return KNOWN_PROFILES.some((p) => p.uri === uri)
}

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
            const resolver = new CrateResolver(this.resolverOptions)
            try {
                const resolved = await resolver.resolveCrate(profileURI)
                profileMetadata = resolved.metadata
                profileCrateFiles = resolved.fileService
            } catch (e) {
                throw e instanceof ProfileHandlerError
                    ? e
                    : new ProfileHandlerError(
                          `Failed to resolve external profile crate ${profileURI}`,
                          { cause: e, profileUri: profileURI }
                      )
            }
        }

        async function tryIsApplicable(strategy: IProfileFactoryStrategy): Promise<boolean> {
            try {
                return await strategy.isApplicable(profileMetadata, profileCrateFiles)
            } catch (e) {
                console.error(
                    `Profile factory strategy ${strategy.name} threw unexpectedly in the isApplicable method`,
                    e
                )
                return false
            }
        }

        const strategies = known && known.strategy ? [known.strategy] : []

        if (strategies.length === 0) {
            for (const strat of STRATEGIES) {
                if (await tryIsApplicable(strat)) {
                    strategies.push(strat)
                }
            }
        }

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
