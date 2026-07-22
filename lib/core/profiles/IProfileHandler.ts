import { IObservable } from "@/lib/core/IObservable"
import { ProfileDefinition } from "@/lib/core/profiles/types/ProfileDefinition"
import { ProfileClass } from "@/lib/core/profiles/types/ProfileClass"
import { ProfileProperty } from "@/lib/core/profiles/types/ProfileProperty"

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
     * The unique identifier of this profile instance. It must be unique in each instance of the class.
     */
    readonly id: string

    /**
     * The human-readable name of this profile handler
     */
    readonly name: string

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
     * is responsible for mapping the entity @ids to class rule identifiers.
     * @param entities in the graph
     */
    updateEntityMapping(entities: IEntity[]): void

    /**
     * Maps entity @ids to class rule identifiers. Entities that do not match any class rule are not
     * included by default. The profile implementation is responsible for mapping the entity @ids to
     * class rule identifiers.
     */
    getEntityMapping(): Map<string, string>

    /**
     * Get the class rule corresponding to the given id. Returns undefined if it does not exist
     * @param id of the class rule
     */
    getClassRule(id: string): ProfileClass | undefined

    /**
     * Get the property rule corresponding to the given id. Returns undefined if it does not exist
     * @param id of the property rule
     */
    getPropertyRule(id: string): ProfileProperty | undefined

    /**
     * Get all property rules whose domainIncludes contains the given class rule id. Returns an empty array if none exist
     * or if the class rule does not exist
     * @param classRuleId id of the class rule
     */
    getPropertiesOnClass(classRuleId: string): ProfileProperty[]

    /**
     * Discard the profile. This will remove any event listeners this profile has registered.
     */
    discard(): void
}
