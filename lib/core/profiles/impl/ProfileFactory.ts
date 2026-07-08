import { CrateSchema, pickFirst } from "@/lib/utils"
import { ContextServiceImpl } from "@/lib/core/impl/ContextServiceImpl"
import { RO_CRATE_VERSION } from "@/lib/constants"
import { ProfileDefinition } from "@/lib/core/profiles/types/ProfileDefinition"
import { IProfileFactoryStrategy } from "@/lib/core/profiles/IProfileFactoryStrategy"
import { IProfile } from "@/lib/core/profiles/IProfile"
import { MASPStrategy } from "@/lib/core/profiles/impl/masp/MASPStrategy"

const KNOWN_PROFILES: {
    uri: string
    loadProfile: () => Promise<ICrate>
    strategy?: IProfileFactoryStrategy
}[] = [
    {
        uri: "https://w3id.org/workflowhub/workflow-ro-crate/",
        async loadProfile() {
            const crate = await import("./assets/workflow-1.0.json")
            return CrateSchema.parse(crate)
        },
        strategy: new MASPStrategy()
    },
    {
        uri: "https://w3id.org/workflowhub/workflow-ro-crate/1.0",
        async loadProfile() {
            const crate = await import("./assets/workflow-1.0.json")
            return CrateSchema.parse(crate)
        },
        strategy: new MASPStrategy()
    }
]

const STRATEGIES: IProfileFactoryStrategy[] = [new MASPStrategy()]

export class ProfileFactory {
    async createProfileFromURI(profileURI: string) {
        const known = KNOWN_PROFILES.find((p) => p.uri === profileURI)

        let profileMetadata: ICrate
        if (known) {
            try {
                profileMetadata = await known.loadProfile()
            } catch (e) {
                throw new Error(`Failed to load known profile ${profileURI}`, { cause: e })
            }
        } else {
            throw new Error(
                `Unknown profile URI: ${profileURI}. Unknown profiles are not supported yet`
            )
        }

        const strategies =
            known && known.strategy
                ? [known.strategy]
                : STRATEGIES.filter((s) => s.isApplicable(profileMetadata))

        let result: IProfile | undefined = undefined
        for (const strategy of strategies) {
            if (result) break
            try {
                result = await strategy.createProfileFromProfileCrate(profileMetadata)
            } catch (e) {
                console.warn(`Failed to create profile with strategy "${strategy.name}"`, e)
            }
        }

        if (!result) {
            throw new Error(
                `Could not create profile from metadata, no strategy matched/successful`
            )
        }

        return result
    }
}

export function buildProfileDefinitionFromRootEntity(rootEntity: IEntity): ProfileDefinition {
    const name = pickFirst(rootEntity.name)
    const isProfileOf = pickFirst(rootEntity.isProfileOf)
    const version = pickFirst(rootEntity.version)
    const description = pickFirst(rootEntity.description)

    return {
        "@id": rootEntity["@id"],
        name: typeof name === "string" ? name : "Unnamed",
        specification:
            typeof isProfileOf !== "string"
                ? (ContextServiceImpl.getKnownContext(isProfileOf["@id"])?.version ??
                  RO_CRATE_VERSION.V1_1_3)
                : RO_CRATE_VERSION.V1_1_3,
        version: typeof version === "string" ? version : undefined,
        description: typeof description === "string" ? description : undefined,
        classes: [],
        properties: []
    }
}
