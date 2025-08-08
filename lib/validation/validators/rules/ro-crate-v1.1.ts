import {
    CrateRule,
    EntityRule,
    EntityValidationResult,
    PropertyRule,
    RuleBuilder
} from "@/lib/validation/validators/rule-based-validator"
import { toArray } from "@/lib/utils"
import { propertyValue, PropertyValueUtils } from "@/lib/property-value-utils"
import { DateTime } from "luxon"
import { ValidationResultBuilder } from "@/lib/validation/validation-result-builder"

const builder = new ValidationResultBuilder("RO-Crate v1.1")

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
                    builder.rule("missingMetadataEntity").error({
                        resultTitle: "Missing metadata entity",
                        resultDescription: "The crate must have a metadata entity",
                        helpUrl:
                            "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#ro-crate-metadata-file-descriptor"
                    })
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
                    builder.rule("missingRootEntity").error({
                        resultTitle: "Missing root entity",
                        resultDescription: "The crate must have a root entity"
                    })
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
                results.push(
                    builder.rule("rootEntityId").warning({
                        resultTitle: "Root entity id is not `./`",
                        resultDescription: "The id of the root entity should be `./`",
                        entityId: rootId,
                        helpUrl:
                            "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#direct-properties-of-the-root-data-entity"
                    })
                )
            }
            if (rootId && !rootId.endsWith("/")) {
                results.push(
                    builder.rule("rootEntityId").error({
                        resultTitle: "Root entity id invalid",
                        resultDescription: "The id of the root entity MUST end with `/`",
                        entityId: rootId,
                        helpUrl:
                            "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#direct-properties-of-the-root-data-entity"
                    })
                )
            }

            return results
        },
        async (entity) => {
            if (entity["@id"] === "ro-crate-metadata.jsonld") {
                return [
                    builder.rule("legacyMetadataEntity").warning({
                        resultTitle: "Legacy metadata file name",
                        resultDescription:
                            "The metadata file `ro-crate-metadata.jsonld` should be renamed to `ro-crate-metadata.json`",
                        entityId: entity["@id"],
                        helpUrl:
                            "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#ro-crate-metadata-file-descriptor"
                    })
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
                        builder.rule("metadataEntityType").error({
                            resultTitle: "Metadata entity has wrong type",
                            resultDescription:
                                "The type of the metadata entity must be `CreativeWork`",
                            entityId: entity["@id"],
                            propertyName: "@type",
                            helpUrl:
                                "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#ro-crate-metadata-file-descriptor"
                        })
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
                        builder.rule("metadataEntityConformsTo").warning({
                            resultTitle: "Incomplete metadata entity",
                            resultDescription:
                                "The metadata entity does not have a `conformsTo` property. It should be a versioned permalink URI of the RO-Crate specification that the RO-Crate JSON-LD conforms to`",
                            entityId: entity["@id"],
                            helpUrl:
                                "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#ro-crate-metadata-file-descriptor"
                        })
                    ]
                } else if (
                    toArray(entity.conformsTo).some((s) =>
                        propertyValue(s).containsSubstring({ "@id": "https://w3id.org/ro/crate/" })
                    )
                ) {
                    return [
                        builder.rule("metadataEntityConformsTo").warning({
                            resultTitle: "Incomplete metadata entity",
                            resultDescription:
                                "The conformsTo of the RO-Crate Metadata File Descriptor SHOULD be a versioned permalink URI of the RO-Crate specification that the RO-Crate JSON-LD conforms to",
                            entityId: entity["@id"],
                            propertyName: "conformsTo",
                            helpUrl:
                                "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#ro-crate-metadata-file-descriptor"
                        })
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
                        builder.rule("metadataEntityAbout").error({
                            resultTitle: "Incomplete metadata entity",
                            resultDescription:
                                "The metadata entity does not have an `about` property. The `about` property must reference the root data entity of the RO-Crate",
                            entityId: entity["@id"],
                            helpUrl:
                                "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#ro-crate-metadata-file-descriptor"
                        })
                    ]
                }
            }
            return []
        },
        async (entity) => {
            const results: EntityValidationResult[] = []
            if (entity["@id"] === ctx.editorState.getState().getRootEntityId()) {
                if (!propertyValue(entity["@type"]).is("Dataset")) {
                    results.push(
                        builder.rule("rootEntityType").error({
                            resultTitle: "Incorrect root entity type",
                            resultDescription: "The type of the root entity MUST be `Dataset`",
                            entityId: entity["@id"],
                            helpUrl:
                                "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#direct-properties-of-the-root-data-entity"
                        })
                    )
                }
                if (!("name" in entity)) {
                    results.push(
                        builder.rule("rootEntityName").error({
                            resultTitle: "Missing root entity name",
                            resultDescription:
                                "The root entity MUST have a `name` property to disambiguate it from other RO-Crates",
                            entityId: entity["@id"],
                            helpUrl:
                                "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#direct-properties-of-the-root-data-entity"
                        })
                    )
                }
                if (!("description" in entity)) {
                    results.push(
                        builder.rule("rootEntityDescription").error({
                            resultTitle: "Missing root entity description",
                            resultDescription:
                                "The root entity MUST have a `description` to provide a summary of the context in which the dataset is important",
                            entityId: entity["@id"],
                            helpUrl:
                                "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#direct-properties-of-the-root-data-entity"
                        })
                    )
                }
                if (!("datePublished" in entity)) {
                    results.push(
                        builder.rule("rootEntityDatePublished").error({
                            resultTitle: "Missing root entity `datePublished`",
                            resultDescription:
                                "The root entity MUST have a `datePublished` property containing an ISO 8601 date string denoting when the RO-Crate was published",
                            entityId: entity["@id"],
                            helpUrl:
                                "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#direct-properties-of-the-root-data-entity"
                        })
                    )
                } else if (!("license" in entity)) {
                    results.push(
                        builder.rule("rootEntityLicense").error({
                            resultTitle: "Missing root entity license",
                            resultDescription:
                                "The root entity MUST have a `license` property referencing a Contextual Entity or a URI",
                            entityId: entity["@id"],
                            helpUrl:
                                "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#direct-properties-of-the-root-data-entity"
                        })
                    )
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
                        builder.rule("rootEntityDatePublishedFormat").error({
                            resultTitle: "Invalid time string in `datePublished` property",
                            resultDescription:
                                "The `datePublished` property MUST contain an ISO 8601 date string",
                            entityId: entity["@id"],
                            propertyName: "datePublished",
                            helpUrl:
                                "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#direct-properties-of-the-root-data-entity"
                        })
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
                        builder.rule("rootEntityLicenseRef").error({
                            resultTitle: "Empty license",
                            resultDescription:
                                "The root entity MUST have a `license` property referencing a Contextual Entity or a URI",
                            entityId: entity["@id"],
                            propertyName: "license",
                            helpUrl:
                                "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#direct-properties-of-the-root-data-entity"
                        })
                    ]
                }

            return []
        }
    ]) satisfies RuleBuilder<PropertyRule>
}
