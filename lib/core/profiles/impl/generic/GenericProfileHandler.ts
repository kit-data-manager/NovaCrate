import { AbstractProfileHandler } from "@/lib/core/profiles/impl/AbstractProfileHandler"

/**
 * Fallback profile implementation that is used when no other profile implementation is applicable.
 */
export class GenericProfileHandler extends AbstractProfileHandler {
    readonly name: string = "Generic"

    constructor(profileUri: string, rootEntity: IEntity) {
        super(profileUri, rootEntity)
    }

    updateEntityMapping(entities: IEntity[]): void {
        // The generic profile does not have any entity mappings
        this.entityMapping = new Map()
        super.updateEntityMapping(entities)
    }
}
