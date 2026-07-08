import { IProfile, IProfileEvents } from "@/lib/core/profiles/IProfile"
import { Observable } from "@/lib/core/impl/Observable"
import { IObservable } from "@/lib/core/IObservable"
import { ProfileDefinition } from "@/lib/core/profiles/types/ProfileDefinition"
import { propertyValue } from "@/lib/property-value-utils"
import { z } from "zod/mini"
import { ProfileProperty } from "@/lib/core/profiles/types/ProfileProperty"
import { buildProfileDefinitionFromRootEntity } from "@/lib/core/profiles/impl/ProfileFactory"
import { pickFirst, toArray } from "@/lib/utils"
import { stringifyError } from "@/components/error"

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

const MASPItemList = z.object({
    itemListElement: z.union([
        z.object({ "@id": z.string() }),
        z.array(z.object({ "@id": z.string() }))
    ])
})

export class MASPProfile implements IProfile {
    private _events = new Observable<IProfileEvents>()
    readonly events: IObservable<IProfileEvents> = this._events
    readonly name = "MASP"
    readonly id

    private isReady = true
    private readonly definition: ProfileDefinition
    private errors: string[] = []

    constructor(rootEntity: IEntity, maspEntities: IEntity[]) {
        this.definition = buildProfileDefinitionFromRootEntity(rootEntity)
        this.id = crypto.randomUUID()

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
                    "@id": d["@id"],
                    name: d.name,
                    description: d.description,
                    label: d["rdfs:label"],
                    maxCount: d["sh:maxCount"],
                    minCount: d["sh:minCount"],
                    specializationOf: d["prov:specializationOf"]
                        ? pickFirst(d["prov:specializationOf"])["@id"]
                        : undefined // TODO FIX: Only the first entry is used, all others are dropped
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
                    "@id": d["@id"],
                    name: d.name,
                    description: d.description,
                    label: d["rdfs:label"],
                    maxCount: d["sh:maxCount"],
                    minCount: d["sh:minCount"],
                    specializationOf: d["prov:specializationOf"] // TODO FIX: Only the first entry is used, all others are dropped
                        ? pickFirst(d["prov:specializationOf"])["@id"]
                        : undefined,
                    domainIncludes: toArray(d.domainIncludes),
                    value: d.value,
                    rangeIncludes: d.rangeIncludes ? toArray(d.rangeIncludes) : undefined,
                    options
                })
            } else {
                this.errors.push(
                    `Failed to parse MASP property rule with id "${unparsedPropertyRule["@id"]}"}: ` +
                        parsedPropertyRule.error.message
                )
            }
        }
    }

    getIsReady(): boolean {
        return this.isReady
    }

    getErrors(): string[] {
        return structuredClone(this.errors)
    }

    getDefinition(): ProfileDefinition {
        return this.definition
    }
}

function determineMASPPropertyOptions(
    property: z.infer<typeof MASPProperty>,
    maspEntities: IEntity[]
) {
    let options: ProfileProperty["options"] | undefined = undefined

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
