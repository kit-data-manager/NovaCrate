import { IMetadataService } from "@/lib/core/IMetadataService"
import { AbstractProfileHandler } from "@/lib/core/profiles/impl/AbstractProfileHandler"

/**
 * Fallback profile implementation that is used when no other profile implementation is applicable.
 */
export class GenericProfileHandler extends AbstractProfileHandler {
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
