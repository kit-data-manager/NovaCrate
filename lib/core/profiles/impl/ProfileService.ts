import { IProfileService, IProfileServiceEvents } from "@/lib/core/profiles/IProfileService"
import { IObservable } from "@/lib/core/IObservable"
import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"
import { Observable } from "@/lib/core/impl/Observable"
import { ProfileFactory } from "@/lib/core/profiles/impl/ProfileFactory"
import { IMetadataService } from "@/lib/core/IMetadataService"
import { getRootEntityID, toArray } from "@/lib/utils"
import { stringifyError } from "@/components/error"

export class ProfileService implements IProfileService {
    private _events = new Observable<IProfileServiceEvents>()
    readonly events: IObservable<IProfileServiceEvents> = this._events
    private profileURIs: string[] = []
    private profiles: IProfileHandler[] = []
    private profileConstructionErrors: string[] = []
    private metadata: IMetadataService

    constructor(metadata: IMetadataService) {
        this.probeAllReady = this.probeAllReady.bind(this)
        this.forwardErrorEvent = this.forwardErrorEvent.bind(this)

        metadata.events.addEventListener("graph-changed", (e) => {
            this.parseProfileURIsFromEntities(e)
        })
        this.parseProfileURIsFromEntities(metadata.getEntities())
        this.metadata = metadata
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

    getProfiles(): IProfileHandler[] {
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
                this._events.emit("profiles-changed", this.getProfiles())

                // Error handling
                profile.events.addEventListener("error-emitted", this.forwardErrorEvent)
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
            this._events.emit("all-ready-changed", true)
        } else {
            this.profiles.forEach((p) =>
                p.events.addEventListener("ready-changed", this.probeAllReady)
            )
        }
    }
}
