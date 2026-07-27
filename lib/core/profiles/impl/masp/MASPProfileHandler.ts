import { propertyValue, PropertyValueUtils } from "@/lib/property-value-utils"
import { z } from "zod/mini"
import { ProfileProperty } from "@/lib/core/profiles/types/ProfileProperty"
import { isValidUrl, pickFirst, toArray } from "@/lib/utils"
import { stringifyError } from "@/components/error"
import { IMetadataService } from "@/lib/core/IMetadataService"
import { AbstractProfileHandler } from "@/lib/core/profiles/impl/AbstractProfileHandler"
import { ProfileClass } from "@/lib/core/profiles/types/ProfileClass"
import { ProfilePropertyValue } from "@/lib/core/profiles/types/ProfilePropertyValue"
import { IContextResolverService } from "@/lib/core/IContextResolverService"

const MASPClass = z.object({
    "@id": z.string(),
    name: z.optional(z.string()),
    description: z.optional(z.string()),
    "prov:specializationOf": z.optional(
        z.union([z.object({ "@id": z.string() }), z.array(z.object({ "@id": z.string() }))])
    ),
    "rdfs:label": z.optional(z.string()),
    "sh:maxCount": z.optional(z.coerce.number()),
    "sh:minCount": z.optional(z.coerce.number())
})

const MASPProperty = z.object({
    "@id": z.string(),
    name: z.optional(z.string()),
    description: z.optional(z.string()),
    "prov:specializationOf": z.optional(
        z.union([z.object({ "@id": z.string() }), z.array(z.object({ "@id": z.string() }))])
    ),
    "rdfs:label": z.string(),
    "sh:maxCount": z.optional(z.coerce.number()),
    "sh:minCount": z.optional(z.coerce.number()),
    domainIncludes: z.union([
        z.object({ "@id": z.string() }),
        z.array(z.object({ "@id": z.string() }))
    ]),
    rangeIncludes: z.optional(
        z.union([z.object({ "@id": z.string() }), z.array(z.object({ "@id": z.string() }))])
    ),
    value: z.optional(z.string())
})

const MASPPropertyValue = z.object({
    "@id": z.string(),
    name: z.optional(z.string()),
    description: z.optional(z.string()),
    "sh:maxCount": z.optional(z.coerce.number()),
    "sh:minCount": z.optional(z.coerce.number()),
    value: z.union([z.string(), z.object({ "@id": z.string() })])
})

const MASPItemList = z.object({
    itemListElement: z.union([
        z.object({ "@id": z.string() }),
        z.array(z.object({ "@id": z.string() }))
    ])
})

export class MASPProfileHandler extends AbstractProfileHandler {
    readonly name = "MASP"

    constructor(
        rootEntity: IEntity,
        maspEntities: IEntity[],
        private context: IContextResolverService,
        metadataService: IMetadataService
    ) {
        super(rootEntity, metadataService)
        this.autoResolveTerm = this.autoResolveTerm.bind(this)

        //
        // Parse Class Rules
        //
        for (const unparsedClassRule of maspEntities.filter((entity) =>
            propertyValue(entity["@type"]).contains("rdfs:Class")
        )) {
            const parsedClassRule = MASPClass.safeParse(unparsedClassRule)

            if (parsedClassRule.success) {
                const d = parsedClassRule.data
                this.definition.classes.push({
                    "@id": httpsifyUrl(d["@id"]),
                    onProfile: this.definition["@id"],
                    onHandler: this.id,
                    name: d.name,
                    description: d.description,
                    label: d["rdfs:label"],
                    maxCount: d["sh:maxCount"],
                    minCount: d["sh:minCount"],
                    specializationOf: d["prov:specializationOf"]
                        ? toArray(d["prov:specializationOf"]).map(this.autoResolveTerm)
                        : undefined
                })
            } else {
                this.errors.push(
                    `Failed to parse MASP class rule with id "${unparsedClassRule["@id"]}"}: ` +
                        parsedClassRule.error.message
                )
            }
        }

        //
        // Parse Property Rules
        //
        for (const unparsedPropertyRule of maspEntities.filter((entity) =>
            propertyValue(entity["@type"]).contains("rdf:Property")
        )) {
            const parsedPropertyRule = MASPProperty.safeParse(unparsedPropertyRule)

            if (parsedPropertyRule.success) {
                const d = parsedPropertyRule.data

                let options: ProfileProperty["options"] | undefined = undefined
                try {
                    options = determineMASPPropertyOptions(d, maspEntities)
                } catch (e) {
                    console.error(`Failed to determine options for property ${d["@id"]}`, e)
                    this.errors.push(
                        `Failed to determine options for property ${d["@id"]}:` + stringifyError(e)
                    )
                }

                this.definition.properties.push({
                    "@id": httpsifyUrl(d["@id"]),
                    onProfile: this.definition["@id"],
                    onHandler: this.id,
                    name: d.name,
                    description: d.description,
                    label: d["rdfs:label"],
                    maxCount: d["sh:maxCount"],
                    minCount: d["sh:minCount"],
                    specializationOf: d["prov:specializationOf"] // TODO FIX: Only the first entry is used, all others are dropped
                        ? this.autoResolveTerm(pickFirst(d["prov:specializationOf"]))
                        : undefined,
                    domainIncludes: toArray(d.domainIncludes),
                    rangeIncludes: d.rangeIncludes
                        ? toArray(d.rangeIncludes).map(this.autoResolveTerm)
                        : undefined,
                    options
                })
            } else {
                this.errors.push(
                    `Failed to parse MASP property rule with id "${unparsedPropertyRule["@id"]}"}: ` +
                        parsedPropertyRule.error.message
                )
            }
        }

        //
        // Parse Property Value Rules
        //
        for (const unparsedPropertyValueRule of maspEntities.filter((entity) =>
            propertyValue(entity["@type"]).contains("PropertyValue")
        )) {
            const parsedPropertyValueRule = MASPPropertyValue.safeParse(unparsedPropertyValueRule)

            if (parsedPropertyValueRule.success) {
                const d = parsedPropertyValueRule.data

                this.definition.propertyValues.push({
                    "@id": httpsifyUrl(d["@id"]),
                    onProfile: this.definition["@id"],
                    onHandler: this.id,
                    name: d.name,
                    description: d.description,
                    maxCount: d["sh:maxCount"],
                    minCount: d["sh:minCount"],
                    value: d.value
                })
            } else {
                this.errors.push(
                    `Failed to parse MASP property value rule with id "${unparsedPropertyValueRule["@id"]}"}: ` +
                        parsedPropertyValueRule.error.message
                )
            }
        }

        // Listener for automatic updates is attached in the abstract superclass
        this.updateEntityMapping(metadataService.getEntities())
        console.log(`Done with parsing MASP profile ${this.definition.name}`, this.definition)
    }

    autoResolveTerm(term: IReference): IReference {
        const withHttps = httpsifyUrlRef(term)
        if (!isValidUrl(withHttps["@id"])) {
            withHttps["@id"] = this.context.resolve(withHttps["@id"]) ?? withHttps["@id"]
        }
        return withHttps
    }

    async updateEntityMapping(entities: IEntity[]) {
        const def = this.getDefinition()
        if (!def || !this.getIsReady()) return []

        const classRuleMapping = new Map<string, string>()
        const done = new Set<string>()
        const queue: string[] = []

        const metadataDescriptorClassRule = this.findClassRuleWithMetadataDescriptorProperty(def)
        if (!metadataDescriptorClassRule) {
            this.pushError("Missing metadata descriptor property rule")
            return
        }

        const metadataDescriptorEntity = entities.find((e) => e["@id"] === "ro-crate-metadata.json")
        if (!metadataDescriptorEntity) {
            this.pushError("Missing metadata descriptor entity")
            return
        }

        classRuleMapping.set(metadataDescriptorEntity["@id"], metadataDescriptorClassRule["@id"])

        const aboutPropertyRule = this.findPropertyRuleForLabel(
            def,
            metadataDescriptorClassRule["@id"],
            "about"
        )
        if (!aboutPropertyRule) {
            this.pushError("Missing 'about' property rule on metadata descriptor")
            return
        }

        const aboutValue = metadataDescriptorEntity["about"]
        if (
            !aboutValue ||
            !propertyValue(aboutValue).hasRefs() ||
            propertyValue(aboutValue).isEmpty()
        ) {
            this.pushError("Missing 'about' property on metadata descriptor")
            return
        }

        let rootEntityId: string | undefined
        propertyValue(aboutValue).forEach((v) => {
            if (PropertyValueUtils.isRef(v) && !rootEntityId) {
                rootEntityId = v["@id"]
            }
        })
        if (!rootEntityId) {
            this.pushError("Missing root entity reference")
            return
        }

        const rootEntityClassRuleId = this.findClassRuleIdByRange(
            def,
            aboutPropertyRule.rangeIncludes
        )
        if (!rootEntityClassRuleId) {
            this.pushError("Missing root entity class rule")
            return
        }

        const rootEntity = entities.find((e) => e["@id"] === rootEntityId)
        if (!rootEntity) {
            this.pushError("Missing root entity")
            return
        }

        classRuleMapping.set(rootEntityId, rootEntityClassRuleId)
        queue.push(metadataDescriptorEntity["@id"], rootEntityId)

        while (queue.length > 0) {
            const entityId = queue.shift()!
            if (done.has(entityId)) continue
            done.add(entityId)

            const classRuleId = classRuleMapping.get(entityId)
            if (!classRuleId) continue

            const classRule = def.classes.find((c) => c["@id"] === classRuleId)
            if (!classRule) continue

            const entity = entities.find((e) => e["@id"] === entityId)
            if (!entity) continue

            const propertyRulesForClass = this.getPropertiesOnClass(classRuleId)
            for (const propRule of propertyRulesForClass) {
                if (!propRule.rangeIncludes) continue

                const targetClassRule = def.classes.filter((c) =>
                    propRule.rangeIncludes?.find((r) => r["@id"] === c["@id"])
                )

                const propertyValueRuleIds = def.propertyValues
                    .filter((c) => propRule.rangeIncludes?.find((r) => r["@id"] === c["@id"]))
                    .filter((propertyValuerRule) => typeof propertyValuerRule.value === "object")

                targetClassRule.push(
                    ...propertyValueRuleIds
                        .map((propertyValueRule) =>
                            def.classes.find(
                                (c) => c["@id"] === (propertyValueRule.value as IReference)["@id"]
                            )
                        )
                        .filter((c) => c !== undefined)
                )

                if (targetClassRule.length === 0) continue

                const propValues = propertyValue(entity[propRule.label] ?? [])
                propValues.forEach((value) => {
                    if (PropertyValueUtils.isRef(value) && !propertyValue(value).isEmpty()) {
                        const refId = (value as IReference)["@id"]
                        const targetEntity = entities.find((e) => e["@id"] === refId)
                        if (targetEntity) {
                            const resolved = toArray(targetEntity["@type"]).map(
                                (type) => this.context.resolve(type) ?? type
                            )
                            for (const classRule of targetClassRule) {
                                const matches = classRule.specializationOf
                                    ? classRule.specializationOf.every((type) =>
                                          resolved.find((t) => t === type["@id"])
                                      )
                                    : true
                                if (matches && refId && !classRuleMapping.has(refId)) {
                                    classRuleMapping.set(refId, classRule["@id"])
                                    queue.push(refId)
                                }
                            }
                        }
                    }
                })
            }
        }

        this.entityMapping = classRuleMapping
        console.log("Mapping updated", this.entityMapping)
        super.updateEntityMapping(entities)
    }

    private pushError(error: unknown) {
        this.errors.push(stringifyError(error))
        this._events.emit("error-emitted")
    }

    private findClassRuleWithMetadataDescriptorProperty(def: {
        classes: ProfileClass[]
        properties: ProfileProperty[]
        propertyValues: ProfilePropertyValue[]
    }) {
        return def.classes.find((classRule) => {
            return def.properties.some((propRule) => {
                if (propRule.label !== "@id") return false
                if (!propRule.domainIncludes.some((d) => d["@id"] === classRule["@id"]))
                    return false
                if (propRule.options) {
                    // TODO is this still an intended path?
                    return (
                        propRule.options.length === 1 &&
                        propRule.options[0] === "ro-crate-metadata.json"
                    )
                } else if (propRule.rangeIncludes && propRule.rangeIncludes.length === 1) {
                    // Find @id = ro-crate-metadata.json rule
                    const propertyValueRule = def.propertyValues.find(
                        (propertyValueRule) =>
                            propertyValueRule["@id"] === propRule.rangeIncludes![0]["@id"]
                    )
                    return !!(
                        propertyValueRule && propertyValueRule.value === "ro-crate-metadata.json"
                    )
                }
                return false
            })
        })
    }

    private findPropertyRuleForLabel(
        def: { classes: ProfileClass[]; properties: ProfileProperty[] },
        classRuleId: string,
        label: string
    ): ProfileProperty | undefined {
        return def.properties.find((propRule) => {
            if (propRule.label !== label) return false
            return propRule.domainIncludes.some((d) => d["@id"] === classRuleId)
        })
    }

    private findClassRuleIdByRange(
        def: { classes: ProfileClass[] },
        rangeIncludes?: IReference[]
    ): string | undefined {
        if (!rangeIncludes) return undefined
        return def.classes.find((c) => rangeIncludes.some((r) => r["@id"] === c["@id"]))?.["@id"]
    }
}

function determineMASPPropertyOptions(
    property: z.infer<typeof MASPProperty>,
    maspEntities: IEntity[]
) {
    let options: ProfileProperty["options"] | undefined = undefined

    if (property.value) {
        return [property.value]
    }

    for (const rangeClass of property.rangeIncludes ? toArray(property.rangeIncludes) : []) {
        const localEntity = maspEntities.find((e) => e["@id"] === rangeClass["@id"])
        if (localEntity && propertyValue(localEntity["@type"]).contains("ItemList")) {
            const itemList = MASPItemList.safeParse(localEntity)
            if (itemList.success) {
                options = toArray(itemList.data.itemListElement)
            } else {
                throw new Error(`Failed to parse ItemList entity with id "${localEntity["@id"]}"`, {
                    cause: itemList.error
                })
            }
        }
    }

    return options
}

function httpsifyUrlRef(ref: IReference): IReference {
    return {
        "@id": httpsifyUrl(ref["@id"])
    }
}

function httpsifyUrl(url: string) {
    if (isValidUrl(url)) {
        if (url.startsWith("http://")) {
            return url.replace("http://", "https://")
        }
    }

    return url
}
