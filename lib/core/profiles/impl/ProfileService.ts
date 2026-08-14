import { IProfileService, IProfileServiceEvents } from "@/lib/core/profiles/IProfileService"
import { IObservable } from "@/lib/core/IObservable"
import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"
import { Observable } from "@/lib/core/impl/Observable"
import { ProfileFactory } from "@/lib/core/profiles/impl/ProfileFactory"
import { IMetadataService } from "@/lib/core/IMetadataService"
import { getRootEntityID, toArray } from "@/lib/utils"
import { stringifyError } from "@/components/error"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { PropertyRule } from "@/lib/core/profiles/types/PropertyRule"
import { ProfileEntityMapping } from "@/lib/core/profiles/types/ProfileEntityMapping"

export class ProfileService implements IProfileService {
    private _events = new Observable<IProfileServiceEvents>()
    readonly events: IObservable<IProfileServiceEvents> = this._events
    private profileURIs: string[] = []
    private profiles: IProfileHandler[] = []
    private profileConstructionErrors: string[] = []
    private entityMappings: Map<string, ProfileEntityMapping[]> = new Map()

    disposeGraphChangedEventListener: () => void

    constructor(private metadata: IMetadataService) {
        this.probeAllReady = this.probeAllReady.bind(this)
        this.forwardErrorEvent = this.forwardErrorEvent.bind(this)
        this.updateEntityMappings = this.updateEntityMappings.bind(this)

        this.disposeGraphChangedEventListener = metadata.events.addEventListener(
            "graph-changed",
            (e) => {
                this.parseProfileURIsFromEntities(e)
            }
        )
        this.parseProfileURIsFromEntities(metadata.getEntities())
    }

    private parseProfileURIsFromEntities(entities: IEntity[]) {
        const rootID = getRootEntityID(entities)
        const root = entities.find((e) => e["@id"] === rootID)
        if (root && root.conformsTo) {
            this.setProfileURIs(
                toArray(root.conformsTo)
                    .filter((v) => typeof v === "object")
                    .map((r) => r["@id"])
            ).then() // The promise is intentionally ignored, this class manages itself automatically
        }
    }

    getAllErrors(): string[] {
        return structuredClone(
            this.profileConstructionErrors.concat(
                this.profiles
                    .map((p) =>
                        p
                            .getErrors()
                            .map(
                                (e) =>
                                    `In ${p.getDefinition()?.name ?? "Unnamed Profile"} (uri: ${p.getDefinition()?.["@id"]}, handler: ${p.name}): ${e}`
                            )
                    )
                    .flat()
            )
        )
    }

    getAllReady(): boolean {
        return this.profiles.every((p) => p.getIsReady())
    }

    getProfileURIs(): string[] {
        return structuredClone(this.profileURIs)
    }

    getProfileHandlers(): IProfileHandler[] {
        return [...this.profiles]
    }

    private probeAllReady() {
        if (this.getAllReady()) {
            this._events.emit("all-ready-changed", true)
        } else {
            this._events.emit("all-ready-changed", false)
        }
    }

    private forwardErrorEvent() {
        this._events.emit("error-emitted")
    }

    setProfileURIsGuard = 0
    async setProfileURIs(profileURIs: string[]): Promise<void> {
        const guard = ++this.setProfileURIsGuard

        if (
            this.profileURIs.length === profileURIs.length &&
            this.profileURIs.every((uri) => profileURIs.includes(uri)) &&
            profileURIs.every((uri) => this.profileURIs.includes(uri))
        ) {
            return // No changes
        }

        this.profileURIs = profileURIs
        this.profiles.forEach((p) => {
            p.events.removeEventListener("ready-changed", this.probeAllReady)
            p.events.removeEventListener("error-emitted", this.forwardErrorEvent)
            p.events.removeEventListener("mapping-updated", this.updateEntityMappings)
        })
        this.profiles = []
        this.profileConstructionErrors = []
        this._events.emit("all-ready-changed", false)
        this._events.emit("profile-uris-changed", this.getProfileURIs())

        const factory = new ProfileFactory()

        for (const uri of profileURIs) {
            try {
                const profile = await factory.createProfileFromURI(uri, this.metadata)
                if (guard !== this.setProfileURIsGuard) break // This guard will stop the current method run if another method run has started in the meantime
                this.profiles.push(profile)
                this._events.emit("profiles-changed", this.getProfileHandlers())

                // Error handling
                // eslint-disable-next-line novacrate/use-add-event-listener-return
                profile.events.addEventListener("error-emitted", this.forwardErrorEvent)
                // eslint-disable-next-line novacrate/use-add-event-listener-return
                profile.events.addEventListener("mapping-updated", this.updateEntityMappings)
                const existingErrors = profile.getErrors()
                if (existingErrors.length > 0) {
                    this.forwardErrorEvent()
                }
            } catch (e) {
                console.error(`Failed to initialize profile ${uri}`, e)
                this.profileConstructionErrors.push(
                    `Failed to initialize profile "${uri}":` + stringifyError(e)
                )
                this.forwardErrorEvent()
            }
        }

        if (this.getAllReady()) {
            this.updateEntityMappings()
            this._events.emit("all-ready-changed", true)
        } else {
            this.profiles.forEach((p) =>
                p.events.addEventListener("ready-changed", this.probeAllReady)
            )
        }
    }

    getProfileHandler(id: string): IProfileHandler | undefined {
        return this.profiles.find((p) => p.id === id)
    }

    getEntityMappings(): Map<string, ProfileEntityMapping[]> {
        return structuredClone(this.entityMappings)
    }

    getPropertiesFor(classes: EntityRule[]) {
        const properties: PropertyRule[] = []
        for (const profileClass of classes) {
            const handler = this.getProfileHandler(profileClass.onHandler)
            if (handler) {
                const profileProperties = handler.getPropertyRulesFor(profileClass["@id"])
                properties.push(...profileProperties)
            }
        }
        return properties
    }

    private updateEntityMappings() {
        const newMappings: Map<string, ProfileEntityMapping[]> = new Map()

        for (const profile of this.getProfileHandlers()) {
            const localMapping = profile.getEntityMapping()
            for (const [entityID, ruleID] of localMapping.entries()) {
                if (newMappings.has(entityID)) {
                    const current = newMappings.get(entityID)!
                    current.push({ profileId: profile.id, entityRuleId: ruleID })
                } else {
                    newMappings.set(entityID, [{ profileId: profile.id, entityRuleId: ruleID }])
                }
            }
        }

        this.entityMappings = newMappings
        this._events.emit("mappings-updated", this.getEntityMappings())
    }

    dispose() {
        this.disposeGraphChangedEventListener()
    }
}
