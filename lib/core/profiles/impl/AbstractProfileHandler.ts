import { IProfileHandler, IProfileHandlerEvents } from "@/lib/core/profiles/IProfileHandler"
import { Observable } from "@/lib/core/impl/Observable"
import { IObservable } from "@/lib/core/IObservable"
import { ProfileDefinition } from "@/lib/core/profiles/types/ProfileDefinition"
import { buildProfileDefinitionFromRootEntity } from "@/lib/core/profiles/impl/ProfileFactory"
import { IMetadataService } from "@/lib/core/IMetadataService"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { PropertyRule } from "@/lib/core/profiles/types/PropertyRule"
import { PropertyValueRule } from "@/lib/core/profiles/types/PropertyValueRule"
import { ProfileHandlerError } from "@/lib/core/profiles/impl/ProfileHandlerError"

/**
 *
 */
export abstract class AbstractProfileHandler implements IProfileHandler {
    protected _events = new Observable<IProfileHandlerEvents>()
    readonly events: IObservable<IProfileHandlerEvents> = this._events
    abstract readonly name: string
    readonly id

    protected isReady = true
    protected readonly definition: ProfileDefinition
    protected errors: ProfileHandlerError[] = []
    protected entityMapping: Map<string, string> = new Map()

    private _discardListener?: () => void

    protected constructor(
        public readonly profileUri: string,
        rootEntity: IEntity
    ) {
        this.id = crypto.randomUUID()
        this.definition = buildProfileDefinitionFromRootEntity(rootEntity, this.id)
    }

    getIsReady(): boolean {
        return this.isReady
    }

    getErrors(): ProfileHandlerError[] {
        return [...this.errors]
    }

    getDefinition(): ProfileDefinition {
        return this.definition
    }

    getEntityRule(id: string): EntityRule | undefined {
        return this.definition.entityRules.find((rule) => rule["@id"] === id)
    }

    getEntityMapping(): Map<string, string> {
        return structuredClone(this.entityMapping)
    }

    getPropertyRulesFor(entityRuleId: string): PropertyRule[] {
        return this.definition.propertyRules.filter((rule) =>
            rule.appliesToEntityRules.some((id) => id === entityRuleId)
        )
    }

    getPropertyRule(id: string): PropertyRule | undefined {
        return this.definition.propertyRules.find((rule) => rule["@id"] === id)
    }

    getPropertyValueRule(id: string): PropertyValueRule | undefined {
        return this.definition.propertyValueRules.find((rule) => rule["@id"] === id)
    }

    updateEntityMapping(_: IEntity[]): void {
        this._events.emit("mapping-updated")
    }

    /**
     * Registers a single listener on the metadata service that updates the
     * entity mapping whenever the graph changes. Must be called at most once per
     * handler instance and must be matched by a single {@link discard} call.
     * Calling attach again without a prior discard would leak the previous
     * listener.
     */
    attach(metadataService: IMetadataService) {
        this.updateEntityMapping(metadataService.getEntities())
        this._discardListener = metadataService.events.addEventListener(
            "graph-changed",
            (entities) => {
                this.updateEntityMapping(entities)
            }
        )
    }

    discard() {
        this._discardListener?.()
    }
}
