import { IObservable } from "@/lib/core/IObservable"

export class Observable<
    T extends Record<string, (...data: any[]) => void>
> implements IObservable<T> {
    private listeners: Map<keyof T, Set<T[keyof T]>> = new Map()

    addEventListener<K extends keyof T>(event: K, listener: T[K]): () => void {
        let set = this.listeners.get(event)
        if (!set) {
            set = new Set()
            this.listeners.set(event, set)
        }
        set.add(listener)
        return () => {
            this.removeEventListener(event, listener)
        }
    }

    removeEventListener<K extends keyof T>(event: K, listener: T[K]): void {
        const set = this.listeners.get(event)
        if (!set) return
        set.delete(listener)
        if (set.size === 0) {
            this.listeners.delete(event)
        }
    }

    emit<K extends keyof T>(event: K, ...data: Parameters<T[K]>): void {
        const set = this.listeners.get(event) as Set<T[K]> | undefined
        if (!set) return
        console.log("Emit event " + (event as string), data)
        for (const listener of set) {
            listener(...data)
        }
    }
}
