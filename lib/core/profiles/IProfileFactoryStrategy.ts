import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"
import { IReadOnlyFileService } from "@/lib/core/persistence/IReadOnlyFileService"

/**
 * Defines a strategy for creating an {@link IProfileHandler} from an {@link ICrate}
 */
export interface IProfileFactoryStrategy {
    /**
     * Human-readable name of the profile factory (for error messages)
     */
    name: string

    /**
     * Whether this factory is applicable to the given profile crate. This method is not called when
     * the strategy is hardwired to a known profile.
     * @param profileMetadata
     * @param profileCrate
     */
    isApplicable(profileMetadata: ICrate, profileCrate: IReadOnlyFileService): Promise<boolean>

    /**
     * Create a profile from the given profile crate. This method should throw an Error when the profile crate
     * can't be parsed for any reason.
     * @param profileUri the profileUri as specified in conformsTo of the root entity. For tracking profileUris to appropriate profile handlers
     * @param profileMetadata
     * @param profileCrate
     */
    createProfileFromProfileCrate(
        profileUri: string,
        profileMetadata: ICrate,
        profileCrate: IReadOnlyFileService
    ): Promise<IProfileHandler>
}
