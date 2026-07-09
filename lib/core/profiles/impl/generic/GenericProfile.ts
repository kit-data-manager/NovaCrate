import { IProfileHandler, IProfileHandlerEvents } from "@/lib/core/profiles/IProfileHandler"
import { Observable } from "@/lib/core/impl/Observable"
import { IObservable } from "@/lib/core/IObservable"
import { ProfileDefinition } from "@/lib/core/profiles/types/ProfileDefinition"
import { buildProfileDefinitionFromRootEntity } from "@/lib/core/profiles/impl/ProfileFactory"

/**
 * Fallback profile implementation that is used when no other profile implementation is applicable.
 */
export class GenericProfile implements IProfileHandler {
    protected _events = new Observable<IProfileHandlerEvents>()
    readonly events: IObservable<IProfileHandlerEvents> = this._events
    readonly name: string = "Generic"
    readonly id

    protected isReady = true
    protected readonly definition: ProfileDefinition
    protected errors: string[] = []

    constructor(rootEntity: IEntity) {
        this.definition = buildProfileDefinitionFromRootEntity(rootEntity)
        this.id = crypto.randomUUID()
    }

    getIsReady(): boolean {
        return this.isReady
    }

    getErrors(): string[] {
        return structuredClone(this.errors)
    }

    getDefinition(): ProfileDefinition {
        return this.definition
    }
}
