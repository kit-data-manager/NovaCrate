import { IObservable } from "@/lib/core/IObservable"
import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"

export type IProfileServiceEvents = {
    /**
     * This event is emitted whenever the ready state of the profiles changes or
     * when a new list of profiles is activated. This event may be called redundantly (e.g. called with "true" twice )
     */
    "all-ready-changed": (ready: boolean) => void
    /**
     * This event is emitted whenever the list of profiles URIs changes.
     */
    "profile-uris-changed": (profileURIs: string[]) => void
    /**
     * This event is emitted whenever the list of active profiles (IProfile instances) changes.
     */
    "profiles-changed": (profiles: IProfileHandler[]) => void
    /**
     * This event is emitted whenever the service or any profiles emit an error.
     */
    "error-emitted": () => void
}

/**
 * This service is responsible for creating {@link IProfileHandler} instances from profile URIs and managing their lifecycle.
 */
export interface IProfileService {
    readonly events: IObservable<IProfileServiceEvents>

    /**
     * Returns true if all profiles are ready to be used. This is true iff
     * - setProfileURIs has been called and the Promise returned by setProfileURIs has been settled
     * - all profiles are ready
     */
    getAllReady(): boolean

    /**
     * Get a list of all errors that occurred during **parsing** of all profiles.
     */
    getAllErrors(): string[]

    /**
     * Set the list of profile URIs that are currently active. This will trigger parsing of all
     * supplied profiles. Once this method returns, all profiles are constructed and available
     * through {@link getProfiles}. Profiles may not be in the ready state at this point. Use
     * {@link getAllReady} and/or {@link events} to check if all profiles are ready.
     * @param profileURIs Array of profile URIs to activate
     */
    setProfileURIs(profileURIs: string[]): Promise<void>

    /**
     * Get a list of all profile URIs that are currently active. This list is complete immediately after
     * {@link setProfileURIs} is called.
     */
    getProfileURIs(): string[]

    /**
     * Get the profiles that are currently active. This is set by {@link setProfileURIs}. Note that
     * the returned array may be incomplete as long as the Promise returned by {@link setProfileURIs}
     * is not yet settled.
     */
    getProfiles(): IProfileHandler[]
}
