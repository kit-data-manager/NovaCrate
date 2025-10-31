import {
    CrateRule,
    EntityRule,
    EntityValidationResult,
    PropertyRule,
    PropertyValidationResult,
    RuleBuilder
} from "@/lib/validation/validators/rule-based-validator"
import {
    canHavePreview,
    isDataEntity,
    isFileDataEntity,
    isFolderDataEntity,
    isValidUrl,
    referenceCheck
} from "@/lib/utils"
import { propertyValue, PropertyValueUtils } from "@/lib/property-value-utils"
import { DateTime } from "luxon"
import { ValidationResultBuilder } from "@/lib/validation/validation-result-builder"

const builder = new ValidationResultBuilder("spec-v1.1")

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
            if (!crate["@graph"].find((e) => e["@id"] === ctx.editorState.getRootEntityId())) {
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
            const rootId = ctx.editorState.getRootEntityId()
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
                if (!("conformsTo" in entity)) {
                    return [
                        builder.rule("metadataEntityConformsToMissing").warning({
                            resultTitle: "Incomplete metadata entity",
                            resultDescription:
                                "The metadata entity does not have a `conformsTo` property. It should be a versioned permalink URI of the RO-Crate specification that the RO-Crate JSON-LD conforms to`",
                            entityId: entity["@id"],
                            helpUrl:
                                "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#ro-crate-metadata-file-descriptor"
                        })
                    ]
                } else if (
                    !propertyValue(entity.conformsTo).containsSubstring({
                        "@id": "https://w3id.org/ro/crate/"
                    })
                ) {
                    return [
                        builder.rule("metadataEntityConformsTo").warning({
                            resultTitle: "Incomplete metadata entity",
                            resultDescription:
                                "The conformsTo of the RO-Crate Metadata File Descriptor SHOULD be a versioned permalink URI of the RO-Crate specification that the RO-Crate JSON-LD conforms to",
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
            if (entity["@id"] === ctx.editorState.getRootEntityId()) {
                if (!propertyValue(entity["@type"]).contains("Dataset")) {
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
                            resultTitle: "Missing root entity property:  name",
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
                            resultTitle: "Missing root entity property:  description",
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
                        builder.rule("rootEntityDatePublished").warning({
                            resultTitle: "Missing root entity property:  `datePublished`",
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
                            resultTitle: "Missing root entity property:  license",
                            resultDescription:
                                "The root entity MUST have a `license` property referencing a Contextual Entity or a URI. It MAY also be a textual description of a license.",
                            entityId: entity["@id"],
                            helpUrl:
                                "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#direct-properties-of-the-root-data-entity"
                        })
                    )
                }
            }
            return results
        },

        async (entity) => {
            const results: EntityValidationResult[] = []
            if (!ctx.serviceProvider || !ctx.crateData.crateId) return results

            if (isDataEntity(entity) && canHavePreview(entity)) {
                try {
                    const result = await ctx.serviceProvider.getCrateFileInfo(
                        ctx.crateData.crateId,
                        entity["@id"]
                    )

                    if (result.type === "file" && !isFileDataEntity(entity)) {
                        results.push(
                            builder.rule("fileDataEntityWrongType").error({
                                resultTitle: "Data entity points to file but has wrong type",
                                resultDescription: `This entity points to a file at \`${entity["@id"]}\`, but the \`type\` of the entity is not \`File\``,
                                entityId: entity["@id"],
                                helpUrl:
                                    "https://www.researchobject.org/ro-crate/specification/1.1/data-entities.html"
                            })
                        )
                    } else if (result.type === "directory" && !isFolderDataEntity(entity)) {
                        results.push(
                            builder.rule("folderDataEntityWrongType").error({
                                resultTitle: "Data entity points to directory but has wrong type",
                                resultDescription: `This entity points to a directory at \`${entity["@id"]}\`, but the \`type\` of the entity is not \`Dataset\``,
                                entityId: entity["@id"],
                                helpUrl:
                                    "https://www.researchobject.org/ro-crate/specification/1.1/data-entities.html"
                            })
                        )
                    }
                } catch (e) {
                    console.error(
                        `Failed to get crate file info during validation for entity ${entity["@id"]}`,
                        e
                    )
                    results.push(
                        builder.rule("dataEntityFileError").error({
                            resultTitle: "Could not find corresponding file or directory",
                            resultDescription: `This data entity points to a file or directory at \`${entity["@id"]}\`, but the corresponding file or directory could not be found in the crate.`,
                            entityId: entity["@id"],
                            helpUrl:
                                "https://www.researchobject.org/ro-crate/specification/1.1/data-entities.html"
                        })
                    )
                }
            }

            return results
        }
    ]) satisfies RuleBuilder<EntityRule>,
    propertyRules: ((ctx) => [
        async (entity, propertyName) => {
            if (entity["@id"] === ctx.editorState.getRootEntityId())
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
            if (entity["@id"] === ctx.editorState.getRootEntityId())
                if (propertyName === "license") {
                    if (propertyValue(entity.license).isEmpty()) {
                        return [
                            builder.rule("rootEntityLicenseEmpty").error({
                                resultTitle: "Empty license",
                                resultDescription:
                                    "The license field is empty. Provide a reference to a Contextual Entity or a URI. You may also provide a textual description of a license.",
                                entityId: entity["@id"],
                                propertyName: "license",
                                helpUrl:
                                    "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#direct-properties-of-the-root-data-entity"
                            })
                        ]
                    } else if (
                        !(
                            PropertyValueUtils.isRef(entity.license) ||
                            PropertyValueUtils.isRefArray(entity.license)
                        )
                    ) {
                        return [
                            builder.rule("rootEntityLicenseNotRef").softWarning({
                                resultTitle: "License field should be a reference",
                                resultDescription:
                                    "The license field should directly reference a Contextual Entity or a URI. You may also provide a textual description of a license.",
                                entityId: entity["@id"],
                                propertyName: "license",
                                helpUrl:
                                    "https://www.researchobject.org/ro-crate/specification/1.1/root-data-entity#direct-properties-of-the-root-data-entity"
                            })
                        ]
                    }
                }

            return []
        },
        async (entity, propertyName) => {
            if (propertyName === "name" && propertyValue(entity.name).isEmpty()) {
                return [
                    builder.rule("entityNameEmpty").warning({
                        resultTitle: "Name is empty",
                        resultDescription:
                            "The `name` property should not be empty, in order for human readers to be able to recognize the entity.",
                        entityId: entity["@id"],
                        propertyName: "name"
                    })
                ]
            }

            return []
        },
        async (entity, propertyName) => {
            if (propertyName === "@type")
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
        async (entity, propertyName) => {
            const results: PropertyValidationResult[] = []
            try {
                const propertyId = ctx.editorState.crateContext.resolve(propertyName)
                if (!propertyId) return []
                const range = await ctx.schemaWorker.worker.execute("getPropertyRange", propertyId)

                if (!referenceCheck(range.map((s) => s["@id"]))) {
                    // Values can't be references
                    propertyValue(entity[propertyName]).forEach((v, i) => {
                        // Exception: URLs seem to be allowed anywhere
                        if (PropertyValueUtils.isRef(v) && !isValidUrl(v["@id"])) {
                            results.push(
                                builder.rule("unallowedRef").error({
                                    resultTitle: `Property \`${propertyName}\` can't be a reference`,
                                    resultDescription: `The property \`${propertyName}\` only allows textual values, but it contains a reference. Remove the reference.`,
                                    entityId: entity["@id"],
                                    propertyName,
                                    propertyIndex: i
                                })
                            )
                        }
                    })
                }
                // Checking if text is allowed is not that simple, skipped for now...
            } catch (e) {
                console.error(
                    `getPropertyRange failed on entity ${entity["@id"]} with property ${propertyName}`,
                    e
                )
            }
            return results
        }
    ]) satisfies RuleBuilder<PropertyRule>
}
