import { IMetadataService } from "@/lib/core/IMetadataService"
import { AbstractProfile } from "@/lib/core/profiles/impl/AbstractProfile"

/**
 * Fallback profile implementation that is used when no other profile implementation is applicable.
 */
export class GenericProfile extends AbstractProfile {
    readonly name: string = "Generic"

    constructor(rootEntity: IEntity, metadataService: IMetadataService) {
        super(rootEntity, metadataService)
    }

    updateEntityMapping(entities: IEntity[]): void {
        // The generic profile does not have any entity mappings
        this.entityMapping = new Map()
        super.updateEntityMapping(entities)
    }
}
