import { IProfileHandler, IProfileHandlerEvents } from "@/lib/core/profiles/IProfileHandler"
import { Observable } from "@/lib/core/impl/Observable"
import { IObservable } from "@/lib/core/IObservable"
import { ProfileDefinition } from "@/lib/core/profiles/types/ProfileDefinition"
import { buildProfileDefinitionFromRootEntity } from "@/lib/core/profiles/impl/ProfileFactory"
import { IMetadataService } from "@/lib/core/IMetadataService"
import { structuredClone } from "next/dist/compiled/@edge-runtime/primitives"
import { ProfileClass } from "@/lib/core/profiles/types/ProfileClass"
import { ProfileProperty } from "@/lib/core/profiles/types/ProfileProperty"

/**
 *
 */
export abstract class AbstractProfile implements IProfileHandler {
    protected _events = new Observable<IProfileHandlerEvents>()
    readonly events: IObservable<IProfileHandlerEvents> = this._events
    abstract readonly name: string
    readonly id

    protected isReady = true
    protected readonly definition: ProfileDefinition
    protected errors: string[] = []
    protected entityMapping: Map<string, string> = new Map()

    private readonly _discardListener: () => void

    protected constructor(rootEntity: IEntity, metadataService: IMetadataService) {
        this.definition = buildProfileDefinitionFromRootEntity(rootEntity)
        this.id = crypto.randomUUID()

        this.updateEntityMapping(metadataService.getEntities())
        this._discardListener = metadataService.events.addEventListener(
            "graph-changed",
            (entities) => {
                this.updateEntityMapping(entities)
            }
        )
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

    getClassRule(id: string): ProfileClass | undefined {
        return this.definition.classes.find((rule) => rule["@id"] === id)
    }

    getEntityMapping(): Map<string, string> {
        return structuredClone(this.entityMapping)
    }

    getPropertiesOnClass(classRuleId: string): ProfileProperty[] {
        return this.definition.properties.filter((rule) =>
            rule.domainIncludes.some((ref) => ref["@id"] === classRuleId)
        )
    }

    getPropertyRule(id: string): ProfileProperty | undefined {
        return this.definition.properties.find((rule) => rule["@id"] === id)
    }

    updateEntityMapping(_: IEntity[]): void {
        this._events.emit("mapping-updated")
    }

    discard() {
        this._discardListener()
    }
}
