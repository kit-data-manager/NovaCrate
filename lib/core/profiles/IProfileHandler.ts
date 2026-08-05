import { IObservable } from "@/lib/core/IObservable"
import { ProfileDefinition } from "@/lib/core/profiles/types/ProfileDefinition"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { PropertyRule } from "@/lib/core/profiles/types/PropertyRule"
import { PropertyValueRule } from "@/lib/core/profiles/types/PropertyValueRule"

export type IProfileHandlerEvents = {
    /**
     * This event is emitted whenever the ready state of the profile changes.
     * This event may be called redundantly (e.g. called with "true" twice ).
     * This event will not be called if the profile is ready immediately after construction.
     */
    "ready-changed": (ready: boolean) => void
    /**
     * This event is emitted whenever the profile implementation emits an error.
     */
    "error-emitted": () => void
    /**
     * This event is emitted whenever the entity mapping is updated.
     */
    "mapping-updated": () => void
}

/**
 * Interface for profile implementations. All profiles share the same profile definition data
 * structures. Profile implementations are free to choose their parsing strategy.
 *
 * Developer notes: This profile interface is used to allow custom profile handling based on top
 * of the harmonized profile definition. In the future, profile implementations might be able to
 * inject their own plugins or widgets.
 */
export interface IProfileHandler {
    readonly events: IObservable<IProfileHandlerEvents>

    /**
     * The unique identifier of this profile instance. It must be unique in each handler instance.
     */
    readonly id: string

    /**
     * The human-readable name of this profile handler
     */
    readonly name: string

    /**
     * The URI of the profile that this handler handles
     */
    readonly profileUri: string

    /**
     * Indicates whether the profile is ready to be used. If this method returns true,
     * {@link getDefinition} must not return null.
     */
    getIsReady(): boolean

    /**
     * Get a list of errors that occurred during **parsing**.
     */
    getErrors(): string[]

    /**
     * Get the profile definition behind this profile. Must not return null when the profile is ready.
     */
    getDefinition(): ProfileDefinition | null

    /**
     * Update the entity mapping. The method is given all entities in the graph. The profile implementation
     * is responsible for mapping the entity @ids to entity rule ids.
     * @param entities in the graph
     */
    updateEntityMapping(entities: IEntity[]): void

    /**
     * Maps entity @ids to entity rule ids. Entities that do not match any rule are not
     * included by default. The profile implementation is responsible for mapping the entity @ids to
     * entity rule identifiers.
     */
    getEntityMapping(): Map<string, string>

    /**
     * Get the entity rule corresponding to the given id. Returns undefined if it does not exist
     * @param id of the entity rule
     */
    getEntityRule(id: string): EntityRule | undefined

    /**
     * Get the property rule corresponding to the given id. Returns undefined if it does not exist
     * @param id of the property rule
     */
    getPropertyRule(id: string): PropertyRule | undefined

    /**
     * Get the property rule corresponding to the given id. Returns undefined if it does not exist
     * @param id of the property rule
     */
    getPropertyValueRule(id: string): PropertyValueRule | undefined

    /**
     * Get all property rules defined on the given entity rule
     * @param entityRuleId id of the entity rule
     */
    getPropertyRulesFor(entityRuleId: string): PropertyRule[]

    /**
     * Discard the profile. This will remove any event listeners this profile has registered.
     */
    discard(): void
}
