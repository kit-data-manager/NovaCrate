import {
    EntityRule,
    EntityValidationResult,
    PropertyRule,
    PropertyValidationResult,
    RuleBuilder
} from "@/lib/validation/validators/rule-based-validator"
import { findEntity, isValidUrl, toArray } from "@/lib/utils"
import { propertyValue, PropertyValueUtils } from "@/lib/property-value-utils"
import { ValidationResultBuilder } from "@/lib/validation/validation-result-builder"

const builder = new ValidationResultBuilder("spec-basics")

export const RoCrateBase = {
    entityRules: (() => [
        async (entity) => {
            const results: EntityValidationResult[] = []
            if (
                entity["@id"] === "ro-crate-metadata.json" ||
                entity["@id"] === "ro-crate-metadata.jsonld"
            )
                return []

            if (!("name" in entity)) {
                results.push(
                    builder.rule("entityName").warning({
                        resultTitle: "Entity should have a name",
                        resultDescription:
                            "Provide a `name` property for this entity to make it easier to recognize for human readers.",
                        entityId: entity["@id"]
                    })
                )
            }

            return results
        }
    ]) satisfies RuleBuilder<EntityRule>,
    propertyRules: ((ctx) => [
        async (entity, propertyName) => {
            if (propertyName === "@type")
                if (
                    entity["@id"] === "ro-crate-metadata.jsonld" ||
                    entity["@id"] === "ro-crate-metadata.json"
                ) {
                } else {
                    const resolved = toArray(entity["@type"]).map(
                        (type, i) => [type, ctx.editorState.crateContext.resolve(type), i] as const
                    )
                    const results: PropertyValidationResult[] = []
                    for (const [type, resolvedType, i] of resolved) {
                        if (resolvedType === null) {
                            results.push(
                                builder.rule("unknownType").error({
                                    resultTitle: `Unknown type \`${type}\``,
                                    resultDescription: `The type \`${type}\` is not defined in the context of this crate. Please use a different type, or add the type to the context. Validation is not available for this type.`,
                                    entityId: entity["@id"],
                                    propertyName: "@type",
                                    propertyIndex: i
                                })
                            )
                        } else {
                            const node = await ctx.schemaWorker.worker.execute(
                                "getNode",
                                resolvedType
                            )
                            if (!node) {
                                results.push(
                                    builder.rule("missingSchemaForType").error({
                                        resultTitle: `Missing schema for type \`${type}\``,
                                        resultDescription: `The type \`${type}\` is defined in the context of this crate (resolved to \`${resolvedType}\`), but the corresponding schema could not be found. Validation is not available for this type.`,
                                        entityId: entity["@id"],
                                        propertyName: "@type",
                                        propertyIndex: i
                                    })
                                )
                            }
                        }
                    }

                    return results
                }
            return []
        },
        async (entity, propertyName) => {
            if (propertyName === "@id" || propertyName === "@type") return []
            const results: PropertyValidationResult[] = []
            try {
                const entities = ctx.editorState.getEntities()
                const propertyId = ctx.editorState.crateContext.resolve(propertyName)
                if (!propertyId)
                    return [
                        builder.rule("propertyNotInContext").info({
                            resultTitle: `Undefined property \`${propertyName}\``,
                            resultDescription: `The property \`${propertyName}\` is not defined in the context of this crate. Please use a different property, or add the property to the context. Validation is not available for this property.`,
                            entityId: entity["@id"],
                            propertyName
                        })
                    ]
                const range = await ctx.schemaWorker.worker.execute("getPropertyRange", propertyId)
                const rangeIds = range.map((s) => s["@id"])

                if (rangeIds.length === 0) {
                    return results
                }

                propertyValue(entity[propertyName]).forEach((v, i) => {
                    if (PropertyValueUtils.isRef(v) && !propertyValue(v).isEmpty()) {
                        const target = findEntity(entities, v["@id"])
                        if (!target && !isValidUrl(v["@id"])) {
                            results.push(
                                builder.rule("unresolvedRef").error({
                                    resultTitle: `Unresolved reference \`${v["@id"]}\``,
                                    resultDescription: `The reference to \`${v["@id"]}\` could not be resolved, no entity with this id exists in this crate.`,
                                    entityId: entity["@id"],
                                    propertyName,
                                    propertyIndex: i
                                })
                            )
                            return
                        }
                        if (!target) return

                        const targetTypes = toArray(target["@type"])
                            .map((v) => ctx.editorState.crateContext.resolve(v))
                            .filter((v) => v !== null)
                        if (targetTypes.length === 0) return // Could not determine type, abort

                        if (rangeIds.some((r) => targetTypes.includes(r))) return
                        else {
                            if (propertyName === "encodingFormat") return // encodingFormat can reference any type, induced from specification
                            results.push(
                                builder.rule("wrongRefType").warning({
                                    resultTitle: `Invalid reference to type \`${target["@type"]}\``,
                                    resultDescription: `The reference to \`${v["@id"]}\` is not allowed here, because it's type \`${target["@type"]}\` can not be used for the property \`${propertyName}\`.`,
                                    entityId: entity["@id"],
                                    propertyName,
                                    propertyIndex: i,
                                    helpUrl: isValidUrl(propertyId) ? propertyId : undefined
                                })
                            )
                            return
                        }
                    } else if (PropertyValueUtils.isRef(v) && propertyValue(v).isEmpty()) {
                        results.push(
                            builder.rule("emptyRef").warning({
                                resultTitle: `Empty reference`,
                                resultDescription: `The reference is empty. You can remove it, link it to an existing entity or create a new matching entity.`,
                                entityId: entity["@id"],
                                propertyName,
                                propertyIndex: i
                            })
                        )
                    }
                })
            } catch (e) {
                console.warn(
                    `getPropertyRange failed on entity ${entity["@id"]} on property "${propertyName}"`,
                    e
                )
            }
            return results
        }
    ]) satisfies RuleBuilder<PropertyRule>
}
