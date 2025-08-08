import {
    CrateRule,
    EntityRule,
    RuleBuilder
} from "@/lib/validation/validators/rule-based-validator"
import { ValidationResult, ValidationResultSeverity } from "@/lib/validation/validation-result"
import { toArray } from "@/lib/utils"
import { propertyValue, PropertyValueUtils } from "@/lib/property-value-utils"
import { DateTime } from "luxon"

export const RoCrateV1_1 = {
    crateRules: ((ctx) => [
        async (crate) => {
            if (
                !crate["@graph"].find(
                    (e) =>
                        e["@id"] === "ro-crate-metadata.jsonld" ||
                        e["@id"] === "ro-crate-metadata.json"
                )
            ) {
                return [
                    {
                        validatorName: "RO-Crate v1.1",
                        resultTitle: "Missing metadata entity",
                        resultDescription: "The crate must have a metadata entity",
                        resultSeverity: ValidationResultSeverity.error,
                        ruleName: "missingMetadataEntity",
                        helpUrl:
                            "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#ro-crate-metadata-file-descriptor"
                    }
                ]
            } else return []
        },
        async (crate) => {
            if (
                !crate["@graph"].find(
                    (e) => e["@id"] === ctx.editorState.getState().getRootEntityId()
                )
            ) {
                return [
                    {
                        validatorName: "RO-Crate v1.1",
                        resultTitle: "Missing root entity",
                        resultDescription: "The crate must have a root entity",
                        resultSeverity: ValidationResultSeverity.error,
                        ruleName: "missingRootEntity"
                    }
                ]
            }
            return []
        },
        async (crate) => {
            const rootId = ctx.editorState.getState().getRootEntityId()
            const results: ValidationResult[] = []

            if (rootId !== "./") {
                results.push({
                    validatorName: "RO-Crate v1.1",
                    resultTitle: "Root entity id is not `./`",
                    resultDescription: "The id of the root entity should be `./`",
                    resultSeverity: ValidationResultSeverity.warning,
                    ruleName: "rootEntityId",
                    entityId: rootId,
                    propertyName: "@id",
                    helpUrl:
                        "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#direct-properties-of-the-root-data-entity"
                })
            }
            if (rootId && !rootId.endsWith("/")) {
                results.push({
                    validatorName: "RO-Crate v1.1",
                    resultTitle: "Root entity id invalid",
                    resultDescription: "The id of the root entity MUST end with `/`",
                    resultSeverity: ValidationResultSeverity.error,
                    ruleName: "rootEntityId",
                    entityId: rootId,
                    propertyName: "@id",
                    helpUrl:
                        "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#direct-properties-of-the-root-data-entity"
                })
            }

            return results
        }
    ]) satisfies RuleBuilder<CrateRule>,

    entityRules: ((ctx) => [
        async (entity) => {
            if (entity["@id"] === "ro-crate-metadata.jsonld") {
                return [
                    {
                        validatorName: "RO-Crate v1.1",
                        resultTitle: "Legacy metadata entity",
                        resultDescription:
                            "The metadata entity `ro-crate-metadata.jsonld` should be renamed to `ro-crate-metadata.json`",
                        resultSeverity: ValidationResultSeverity.warning,
                        ruleName: "legacyMetadataEntity",
                        helpUrl:
                            "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#ro-crate-metadata-file-descriptor"
                    }
                ]
            } else return []
        },
        async (entity) => {
            if (
                entity["@id"] === "ro-crate-metadata.jsonld" ||
                entity["@id"] === "ro-crate-metadata.json"
            ) {
                if (entity["@type"] !== "CreativeWork") {
                    return [
                        {
                            validatorName: "RO-Crate v1.1",
                            resultTitle: "Metadata entity has wrong type",
                            resultDescription:
                                "The type of the metadata entity must be `CreativeWork`",
                            resultSeverity: ValidationResultSeverity.error,
                            ruleName: "metadataEntityType",
                            entityId: entity["@id"],
                            propertyName: "@type",
                            helpUrl:
                                "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#ro-crate-metadata-file-descriptor"
                        }
                    ]
                }
            }
            return []
        },
        async (entity) => {
            if (
                entity["@id"] === "ro-crate-metadata.jsonld" ||
                entity["@id"] === "ro-crate-metadata.json"
            ) {
                if (!("conformsTo" in entity)) {
                    return [
                        {
                            validatorName: "RO-Crate v1.1",
                            resultTitle: "Incomplete metadata entity",
                            resultDescription:
                                "The metadata entity does not have a `conformsTo` property. It should be a versioned permalink URI of the RO-Crate specification that the RO-Crate JSON-LD conforms to`",
                            resultSeverity: ValidationResultSeverity.warning,
                            ruleName: "metadataEntityConformsTo",
                            entityId: entity["@id"],
                            helpUrl:
                                "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#ro-crate-metadata-file-descriptor"
                        }
                    ]
                } else if (
                    toArray(entity.conformsTo).some((s) =>
                        propertyValue(s).containsSubstring({ "@id": "https://w3id.org/ro/crate/" })
                    )
                ) {
                    return [
                        {
                            validatorName: "RO-Crate v1.1",
                            resultTitle: "Incomplete metadata entity",
                            resultDescription:
                                "The conformsTo of the RO-Crate Metadata File Descriptor SHOULD be a versioned permalink URI of the RO-Crate specification that the RO-Crate JSON-LD conforms to",
                            resultSeverity: ValidationResultSeverity.warning,
                            ruleName: "metadataEntityConformsTo",
                            entityId: entity["@id"],
                            propertyName: "conformsTo",
                            helpUrl:
                                "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#ro-crate-metadata-file-descriptor"
                        }
                    ]
                }
            }
            return []
        },
        async (entity) => {
            if (
                entity["@id"] === "ro-crate-metadata.jsonld" ||
                entity["@id"] === "ro-crate-metadata.json"
            ) {
                if (!("about" in entity)) {
                    return [
                        {
                            validatorName: "RO-Crate v1.1",
                            resultTitle: "Incomplete metadata entity",
                            resultDescription:
                                "The metadata entity does not have an `about` property. The `about` property must reference the root data entity of the RO-Crate",
                            resultSeverity: ValidationResultSeverity.error,
                            ruleName: "metadataEntityAbout",
                            entityId: entity["@id"],
                            helpUrl:
                                "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#ro-crate-metadata-file-descriptor"
                        }
                    ]
                }
            }
            return []
        },
        async (entity) => {
            const results: ValidationResult[] = []
            if (entity["@id"] === ctx.editorState.getState().getRootEntityId()) {
                if (!propertyValue(entity["@type"]).is("Dataset")) {
                    results.push({
                        validatorName: "RO-Crate v1.1",
                        resultTitle: "Incorrect root entity type",
                        resultDescription: "The type of the root entity MUST be `Dataset`",
                        resultSeverity: ValidationResultSeverity.error,
                        ruleName: "rootEntityType",
                        entityId: entity["@id"],
                        propertyName: "@type",
                        helpUrl:
                            "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#direct-properties-of-the-root-data-entity"
                    })
                }
                if (!("name" in entity) || propertyValue(entity.name).isEmpty()) {
                    results.push({
                        validatorName: "RO-Crate v1.1",
                        resultTitle: "Root entity name",
                        resultDescription:
                            "The root entity MUST have a `name` property to disambiguate it from other RO-Crates",
                        resultSeverity: ValidationResultSeverity.error,
                        ruleName: "rootEntityName",
                        entityId: entity["@id"],
                        propertyName: "name",
                        helpUrl:
                            "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#direct-properties-of-the-root-data-entity"
                    })
                }
                if (!("description" in entity) || propertyValue(entity.description).isEmpty()) {
                    results.push({
                        validatorName: "RO-Crate v1.1",
                        resultTitle: "Root entity description",
                        resultDescription:
                            "The root entity MUST have a `description` to provide a summary of the context in which the dataset is important",
                        resultSeverity: ValidationResultSeverity.error,
                        ruleName: "rootEntityDescription",
                        entityId: entity["@id"],
                        propertyName: "description",
                        helpUrl:
                            "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#direct-properties-of-the-root-data-entity"
                    })
                }
                if (!("datePublished" in entity)) {
                    results.push({
                        validatorName: "RO-Crate v1.1",
                        resultTitle: "Root entity datePublished",
                        resultDescription:
                            "The root entity MUST have a `datePublished` property containing an ISO 8601 date string denoting when the RO-Crate was published",
                        resultSeverity: ValidationResultSeverity.error,
                        ruleName: "rootEntityDatePublished",
                        entityId: entity["@id"],
                        helpUrl:
                            "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#direct-properties-of-the-root-data-entity"
                    })
                } else if (
                    propertyValue(entity.datePublished).singleStringMatcher(
                        (s) => !DateTime.fromISO(s).isValid
                    )
                ) {
                    results.push({
                        validatorName: "RO-Crate v1.1",
                        resultTitle: "Invalid time string in datePublished property",
                        resultDescription:
                            "The `datePublished` property MUST contain an ISO 8601 date string",
                        resultSeverity: ValidationResultSeverity.error,
                        ruleName: "rootEntityDatePublished",
                        entityId: entity["@id"],
                        propertyName: "datePublished",
                        helpUrl:
                            "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#direct-properties-of-the-root-data-entity"
                    })
                }
                if (
                    !("license" in entity) ||
                    !PropertyValueUtils.isRef(entity.license) ||
                    propertyValue(entity.license).isEmpty()
                ) {
                    results.push({
                        validatorName: "RO-Crate v1.1",
                        resultTitle: "Root entity license",
                        resultDescription:
                            "The root entity MUST have a `license` property referencing a Contextual Entity or a URI",
                        resultSeverity: ValidationResultSeverity.error,
                        ruleName: "rootEntityLicense",
                        entityId: entity["@id"],
                        propertyName: "license",
                        helpUrl:
                            "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#direct-properties-of-the-root-data-entity"
                    })
                }
            }
            return results
        }
    ]) satisfies RuleBuilder<EntityRule>
}
