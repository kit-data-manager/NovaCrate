import {
    CrateRule,
    EntityRule,
    EntityValidationResult,
    PropertyRule,
    RuleBuilder
} from "@/lib/validation/validators/rule-based-validator"
import { ValidationResultSeverity } from "@/lib/validation/validation-result"
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
                        id: crypto.randomUUID(),
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
                        id: crypto.randomUUID(),
                        validatorName: "RO-Crate v1.1",
                        resultTitle: "Missing root entity",
                        resultDescription: "The crate must have a root entity",
                        resultSeverity: ValidationResultSeverity.error,
                        ruleName: "missingRootEntity"
                    }
                ]
            }
            return []
        }
    ]) satisfies RuleBuilder<CrateRule>,

    entityRules: ((ctx) => [
        async (entity) => {
            const rootId = ctx.editorState.getState().getRootEntityId()
            const results: EntityValidationResult[] = []
            if (entity["@id"] !== rootId) {
                return results
            }

            if (rootId !== "./") {
                results.push({
                    id: crypto.randomUUID(),
                    validatorName: "RO-Crate v1.1",
                    resultTitle: "Root entity id is not `./`",
                    resultDescription: "The id of the root entity should be `./`",
                    resultSeverity: ValidationResultSeverity.warning,
                    ruleName: "rootEntityId",
                    entityId: rootId,
                    helpUrl:
                        "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#direct-properties-of-the-root-data-entity"
                })
            }
            if (rootId && !rootId.endsWith("/")) {
                results.push({
                    id: crypto.randomUUID(),
                    validatorName: "RO-Crate v1.1",
                    resultTitle: "Root entity id invalid",
                    resultDescription: "The id of the root entity MUST end with `/`",
                    resultSeverity: ValidationResultSeverity.error,
                    ruleName: "rootEntityId",
                    entityId: rootId,
                    helpUrl:
                        "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#direct-properties-of-the-root-data-entity"
                })
            }

            return results
        },
        async (entity) => {
            if (entity["@id"] === "ro-crate-metadata.jsonld") {
                return [
                    {
                        id: crypto.randomUUID(),
                        validatorName: "RO-Crate v1.1",
                        resultTitle: "Legacy metadata entity",
                        resultDescription:
                            "The metadata entity `ro-crate-metadata.jsonld` should be renamed to `ro-crate-metadata.json`",
                        resultSeverity: ValidationResultSeverity.warning,
                        ruleName: "legacyMetadataEntity",
                        entityId: entity["@id"],
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
                            id: crypto.randomUUID(),
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
                            id: crypto.randomUUID(),
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
                            id: crypto.randomUUID(),
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
                            id: crypto.randomUUID(),
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
            const results: EntityValidationResult[] = []
            if (entity["@id"] === ctx.editorState.getState().getRootEntityId()) {
                if (!propertyValue(entity["@type"]).is("Dataset")) {
                    results.push({
                        id: crypto.randomUUID(),
                        validatorName: "RO-Crate v1.1",
                        resultTitle: "Incorrect root entity type",
                        resultDescription: "The type of the root entity MUST be `Dataset`",
                        resultSeverity: ValidationResultSeverity.error,
                        ruleName: "rootEntityType",
                        entityId: entity["@id"],
                        helpUrl:
                            "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#direct-properties-of-the-root-data-entity"
                    })
                }
                if (!("name" in entity)) {
                    results.push({
                        id: crypto.randomUUID(),
                        validatorName: "RO-Crate v1.1",
                        resultTitle: "Root entity name",
                        resultDescription:
                            "The root entity MUST have a `name` property to disambiguate it from other RO-Crates",
                        resultSeverity: ValidationResultSeverity.error,
                        ruleName: "rootEntityName",
                        entityId: entity["@id"],
                        helpUrl:
                            "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#direct-properties-of-the-root-data-entity"
                    })
                }
                if (!("description" in entity)) {
                    results.push({
                        id: crypto.randomUUID(),
                        validatorName: "RO-Crate v1.1",
                        resultTitle: "Root entity description",
                        resultDescription:
                            "The root entity MUST have a `description` to provide a summary of the context in which the dataset is important",
                        resultSeverity: ValidationResultSeverity.error,
                        ruleName: "rootEntityDescription",
                        entityId: entity["@id"],
                        helpUrl:
                            "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#direct-properties-of-the-root-data-entity"
                    })
                }
                if (!("datePublished" in entity)) {
                    results.push({
                        id: crypto.randomUUID(),
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
                } else if (!("license" in entity)) {
                    results.push({
                        id: crypto.randomUUID(),
                        validatorName: "RO-Crate v1.1",
                        resultTitle: "Root entity license",
                        resultDescription:
                            "The root entity MUST have a `license` property referencing a Contextual Entity or a URI",
                        resultSeverity: ValidationResultSeverity.error,
                        ruleName: "rootEntityLicense",
                        entityId: entity["@id"],
                        helpUrl:
                            "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#direct-properties-of-the-root-data-entity"
                    })
                }
            }
            return results
        }
    ]) satisfies RuleBuilder<EntityRule>,
    propertyRules: ((ctx) => [
        async (entity, propertyName) => {
            if (entity["@id"] === ctx.editorState.getState().getRootEntityId())
                if (
                    propertyName === "datePublished" &&
                    propertyValue(entity.datePublished).singleStringMatcher(
                        (s) => !DateTime.fromISO(s).isValid
                    )
                ) {
                    return [
                        {
                            id: crypto.randomUUID(),
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
                        }
                    ]
                }
            return []
        },
        async (entity, propertyName) => {
            if (entity["@id"] === ctx.editorState.getState().getRootEntityId())
                if (
                    (propertyName === "license" && !PropertyValueUtils.isRef(entity.license)) ||
                    propertyValue(entity.license).isEmpty()
                ) {
                    return [
                        {
                            id: crypto.randomUUID(),
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
                        }
                    ]
                }

            return []
        }
    ]) satisfies RuleBuilder<PropertyRule>
}
