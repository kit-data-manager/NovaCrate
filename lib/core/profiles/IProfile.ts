import { IObservable } from "@/lib/core/IObservable"
import { ProfileDefinition } from "@/lib/core/profiles/ProfileDefinition"

export type IProfileEvents = {
    /**
     * This event is emitted whenever the ready state of the profile changes.
     * This event may be called redundantly (e.g. called with "true" twice )
     */
    "ready-changed": (ready: boolean) => void
}

/**
 * Interface for profile implementations. All profiles share the same profile definition data
 * structures. Profile implementations are free to choose their parsing strategy.
 *
 * Developer notes: This profile interface is used to allow custom profile handling based on top
 * of the harmonized profile definition. In the future, profile implementations might be able to
 * inject their own plugins or widgets.
 */
export interface IProfile {
    readonly events: IObservable<IProfileEvents>

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
