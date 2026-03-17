type RemoveEventListener = () => void

export interface IObservable<T extends Record<string, (...data: any[]) => void>> {
    addEventListener<K extends keyof T>(event: K, listener: T[K]): RemoveEventListener
    removeEventListener<K extends keyof T>(event: K, listener: T[K]): void
}
