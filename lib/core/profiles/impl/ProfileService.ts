import { IProfileService, IProfileServiceEvents } from "@/lib/core/profiles/IProfileService"
import { IObservable } from "@/lib/core/IObservable"
import { IProfile } from "@/lib/core/profiles/IProfile"
import { Observable } from "@/lib/core/impl/Observable"
import { ProfileFactory } from "@/lib/core/profiles/impl/ProfileFactory"
import { IMetadataService } from "@/lib/core/IMetadataService"
import { getRootEntityID, toArray } from "@/lib/utils"

export class ProfileService implements IProfileService {
    private _events = new Observable<IProfileServiceEvents>()
    readonly events: IObservable<IProfileServiceEvents> = this._events
    private profileURIs: string[] = []
    private profiles: IProfile[] = []
    private profileConstructionErrors: string[] = []

    constructor(metadata: IMetadataService) {
        this.probeAllReady = this.probeAllReady.bind(this)
        metadata.events.addEventListener("graph-changed", (e) => {
            this.parseProfileURIsFromEntities(e)
        })
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
            this.profileConstructionErrors.concat(this.profiles.map((p) => p.getErrors()).flat())
        )
    }

    getAllReady(): boolean {
        return this.profiles.every((p) => p.getIsReady())
    }

    getProfileURIs(): string[] {
        return structuredClone(this.profileURIs)
    }

    getProfiles(): IProfile[] {
        return [...this.profiles]
    }

    private probeAllReady() {
        if (this.getAllReady()) {
            this._events.emit("all-ready-changed", true)
        } else {
            this._events.emit("all-ready-changed", false)
        }
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
        this.profiles.forEach((p) =>
            p.events.removeEventListener("ready-changed", this.probeAllReady)
        )
        this.profiles = []
        this.profileConstructionErrors = []
        this._events.emit("all-ready-changed", false)
        this._events.emit("profiles-changed", profileURIs)

        const factory = new ProfileFactory()

        for (const uri of profileURIs) {
            try {
                const profile = await factory.createProfileFromURI(uri)
                if (guard !== this.setProfileURIsGuard) break // This guard will stop the current method run if another method run has started in the meantime
                this.profiles.push(profile)
            } catch (e) {
                console.error(`Failed to initialize profile ${uri}`, e)
                this.profileConstructionErrors.push(
                    `Failed to initialize profile "${uri}":` +
                        (e instanceof Error ? e.message : String(e))
                )
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
