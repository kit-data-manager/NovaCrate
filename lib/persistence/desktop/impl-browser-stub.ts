import {
    IPersistenceService,
    IPersistenceServiceEvents
} from "@/lib/core/persistence/IPersistenceService"
import { ICrateService } from "@/lib/core/persistence/ICrateService"
import { IRepositoryService } from "@/lib/core/persistence/IRepositoryService"
import { IObservable } from "@/lib/core/IObservable"
import { Observable } from "@/lib/core/impl/Observable"

const NOT_AVAILABLE =
    "Desktop persistence is not available in the browser build. Run NovaCrate with NEXT_PUBLIC_PERSISTENCE_BACKEND=desktop to enable it."

/**
 * Browser-build stub for the desktop persistence implementation.
 *
 * The persistence provider imports `@/lib/persistence/desktop/impl`, which
 * `next.config.mjs` aliases to this file unless the app is built with
 * `NEXT_PUBLIC_PERSISTENCE_BACKEND=desktop`. This keeps the Tauri packages
 * and the entire desktop persistence layer out of the browser bundle.
 *
 * The provider never selects the `"desktop"` mode in browser builds, so this
 * class is never instantiated — a construction attempt fails loudly.
 */
export class DesktopPersistenceService implements IPersistenceService {
    private _events = new Observable<IPersistenceServiceEvents>()
    readonly events: IObservable<IPersistenceServiceEvents> = this._events

    constructor(..._args: unknown[]) {
        throw new Error(NOT_AVAILABLE)
    }

    getCrateId(): string | null {
        throw new Error(NOT_AVAILABLE)
    }

    canSetCrateId(): boolean {
        throw new Error(NOT_AVAILABLE)
    }

    setCrateId(_crateId: string | null): void {
        throw new Error(NOT_AVAILABLE)
    }

    getCrateService(): ICrateService | null {
        throw new Error(NOT_AVAILABLE)
    }

    createCrateServiceFor(_crateId: string): Promise<ICrateService | null> {
        throw new Error(NOT_AVAILABLE)
    }

    getRepositoryService(): IRepositoryService | null {
        throw new Error(NOT_AVAILABLE)
    }

    healthCheck(): Promise<void> {
        throw new Error(NOT_AVAILABLE)
    }

    dispose(): void {
        throw new Error(NOT_AVAILABLE)
    }
}
