import { IObservable } from "@/lib/core/IObservable"
import { ProfileDefinition } from "@/lib/core/profiles/types/ProfileDefinition"

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
}
