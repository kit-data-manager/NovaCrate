import { CrateSchema, getRootEntityID, pickFirst } from "@/lib/utils"
import { propertyValue } from "@/lib/property-value-utils"
import { ContextServiceImpl } from "@/lib/core/impl/ContextServiceImpl"
import { RO_CRATE_VERSION } from "@/lib/constants"
import { ProfileDefinition } from "@/lib/core/profiles/ProfileDefinition"

const KNOWN_PROFILES: { uri: string; loadProfile: () => Promise<ICrate> }[] = [
    {
        uri: "https://w3id.org/workflowhub/workflow-ro-crate/",
        async loadProfile() {
            const crate = await import("./assets/workflow-1.0.json")
            return CrateSchema.parse(crate)
        }
    },
    {
        uri: "https://w3id.org/workflowhub/workflow-ro-crate/1.0",
        async loadProfile() {
            const crate = await import("./assets/workflow-1.0.json")
            return CrateSchema.parse(crate)
        }
    }
]

const SCHEMA_RESOURCE = "http://www.w3.org/ns/dx/prof/role/schema"

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

        const rootID = getRootEntityID(profileMetadata["@graph"])
        if (!rootID) {
            throw new Error("Could not determine root entity ID from profile metadata")
        }

        const root = profileMetadata["@graph"].find((e) => e["@id"] === rootID)
        if (!root) {
            throw new Error(`Root entity with ID ${rootID} not found in profile metadata`)
        }
        if (!propertyValue(root["@type"]).contains("Profile")) {
            throw new Error(`Root entity is not a Profile: ${rootID}`)
        }

        const resources = profileMetadata["@graph"].filter((entity) => {
            return propertyValue(entity["@type"]).contains("ResourceDescriptor") && root.hasResource
                ? propertyValue(root.hasResource).contains({ "@id": entity["@id"] })
                : false
        })

        const schemas = resources.filter(
            (entity) =>
                entity.hasRole && propertyValue(entity.hasRole).contains({ "@id": SCHEMA_RESOURCE })
        )

        // We try to find a schema definition in MASP format by expecting an entity with hasPart
        // TODO: Should also check whether the profile conforms to the MASP Profile (once it is officially released with a PID)
        const maspSchema = schemas.find(
            (entity) => entity.hasPart && !propertyValue(entity.hasPart).isEmpty()
        )
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
