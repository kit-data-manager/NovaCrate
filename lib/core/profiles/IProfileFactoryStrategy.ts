import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"
import { IMetadataService } from "@/lib/core/IMetadataService"

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
     * @param profileCrate
     */
    isApplicable(profileCrate: ICrate): boolean

    /**
     * Create a profile from the given profile crate. This method should throw an Error when the profile crate
     * can't be parsed for any reason.
     * @param profileCrate
     * @param metadataService
     */
    createProfileFromProfileCrate(profileCrate: ICrate, metadataService: IMetadataService): Promise<IProfileHandler>
}
