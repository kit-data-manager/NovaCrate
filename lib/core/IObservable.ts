type RemoveEventListener = () => void

/**
 * Generic typed event emitter used throughout the core and persistence layers.
 *
 * `T` is a map of event names to their listener signatures, e.g.:
 * ```ts
 * type MyEvents = {
 *     "data-changed": (newData: Data) => void
 * }
 * const obs: IObservable<MyEvents> = ...
 * obs.addEventListener("data-changed", (data) => console.log(data))
 * ```
 *
 * {@link IObservable.addEventListener} returns a cleanup function that, when
 * called, removes the listener — convenient for use in React `useEffect`
 * teardowns.
 */
export interface IObservable<T extends Record<string, (...data: any[]) => void>> {
    addEventListener<K extends keyof T>(event: K, listener: T[K]): RemoveEventListener
    removeEventListener<K extends keyof T>(event: K, listener: T[K]): void
}
