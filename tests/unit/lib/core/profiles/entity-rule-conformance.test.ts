import {
    checkEntityConformance,
    entityMatchesRuleTypes,
    EntityConformanceContext,
    EntityConformanceRuleLookup
} from "@/lib/core/profiles/impl/util/entity-rule-conformance"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { PropertyRule } from "@/lib/core/profiles/types/PropertyRule"
import { PropertyValueRule } from "@/lib/core/profiles/types/PropertyValueRule"
import { IContextResolverService } from "@/lib/core/IContextResolverService"

const PERSON = "https://schema.org/Person"
const CREATIVE_WORK = "https://schema.org/CreativeWork"
const ORGANIZATION = "https://schema.org/Organization"

const resolver: IContextResolverService = {
    resolve: (id) => ({ Person: PERSON, Organization: ORGANIZATION })[id] ?? null,
    reverse: () => null
}

function makeEntityRule(partial: Partial<EntityRule> & { "@id": string }): EntityRule {
    return { onHandler: "handler", onProfile: "profile", ...partial }
}

function makePropertyRule(
    partial: Partial<PropertyRule> & {
        "@id": string
        label: string
        appliesToEntityRules: string[]
    }
): PropertyRule {
    return { onHandler: "handler", onProfile: "profile", ...partial }
}

function makePropertyValueRule(
    partial: Partial<PropertyValueRule> & { "@id": string; value: string | IReference }
): PropertyValueRule {
    return { onHandler: "handler", onProfile: "profile", ...partial }
}

function makeRuleLookup(
    entityRules: EntityRule[],
    propertyRules: PropertyRule[],
    propertyValueRules: PropertyValueRule[] = []
): EntityConformanceRuleLookup {
    return {
        getPropertyRulesFor: (entityRuleId) =>
            propertyRules.filter((rule) => rule.appliesToEntityRules.includes(entityRuleId)),
        getPropertyValueRule: (id) => propertyValueRules.find((rule) => rule["@id"] === id),
        getEntityRule: (id) => entityRules.find((rule) => rule["@id"] === id)
    }
}

function makeCtx(
    entities: IEntity[],
    isEntityAssignedTo?: EntityConformanceContext["isEntityAssignedTo"]
): EntityConformanceContext {
    const index = new Map(entities.map((e) => [e["@id"], e]))
    return { resolver, getEntity: (id) => index.get(id), isEntityAssignedTo }
}

const thingRule = makeEntityRule({
    "@id": "https://example.org/rules#Thing",
    specializationOf: [CREATIVE_WORK]
})
const openRule = makeEntityRule({ "@id": "https://example.org/rules#Open" })
const personTargetRule = makeEntityRule({ "@id": PERSON, specializationOf: [PERSON] })

describe("entityMatchesRuleTypes", () => {
    it("returns true when the entity types cover specializationOf", () => {
        const entity = { "@id": "e1", "@type": [CREATIVE_WORK] }
        expect(entityMatchesRuleTypes(entity, thingRule, resolver)).toBe(true)
    })

    it("resolves short-form type names via the resolver", () => {
        const entity = { "@id": "e1", "@type": ["Person"] }
        expect(
            entityMatchesRuleTypes(
                entity,
                makeEntityRule({ "@id": "r", specializationOf: [PERSON] }),
                resolver
            )
        ).toBe(true)
    })

    it("returns false when a required type is missing", () => {
        const entity = { "@id": "e1", "@type": [CREATIVE_WORK] }
        expect(
            entityMatchesRuleTypes(
                entity,
                makeEntityRule({ "@id": "r", specializationOf: [ORGANIZATION] }),
                resolver
            )
        ).toBe(false)
    })

    it("returns true for rules without specializationOf", () => {
        const entity = { "@id": "e1", "@type": [ORGANIZATION] }
        expect(entityMatchesRuleTypes(entity, openRule, resolver)).toBe(true)
    })
})

describe("checkEntityConformance", () => {
    it("returns no issues for a fully conforming entity", () => {
        const nameRule = makePropertyRule({
            "@id": "prop-name",
            label: "name",
            minCount: 1,
            appliesToEntityRules: [thingRule["@id"]]
        })
        const entity: IEntity = {
            "@id": "e1",
            "@type": [CREATIVE_WORK],
            name: ["Some Thing"]
        }

        expect(
            checkEntityConformance(
                entity,
                thingRule,
                makeRuleLookup([thingRule], [nameRule]),
                makeCtx([])
            )
        ).toEqual([])
    })

    it("reports missing types with the missing type URIs", () => {
        const entity: IEntity = { "@id": "e1", "@type": [PERSON] }

        expect(
            checkEntityConformance(entity, thingRule, makeRuleLookup([thingRule], []), makeCtx([]))
        ).toEqual([{ kind: "missingType", missingTypes: [CREATIVE_WORK] }])
    })

    it("does not include entity rule minCount/maxCount in the check", () => {
        const rule = makeEntityRule({
            "@id": "https://example.org/rules#Scarce",
            specializationOf: [CREATIVE_WORK],
            minCount: 1,
            maxCount: 1
        })
        const entity: IEntity = { "@id": "e1", "@type": [CREATIVE_WORK] }

        expect(
            checkEntityConformance(entity, rule, makeRuleLookup([rule], []), makeCtx([]))
        ).toEqual([])
    })

    it("reports too few property entries", () => {
        const nameRule = makePropertyRule({
            "@id": "prop-name",
            label: "name",
            minCount: 2,
            appliesToEntityRules: [thingRule["@id"]]
        })
        const entity: IEntity = { "@id": "e1", "@type": [CREATIVE_WORK], name: ["x"] }

        expect(
            checkEntityConformance(
                entity,
                thingRule,
                makeRuleLookup([thingRule], [nameRule]),
                makeCtx([])
            )
        ).toEqual([{ kind: "tooFewPropertyEntries", rule: nameRule, count: 1 }])
    })

    it("reports a missing mandatory property when the property is absent", () => {
        const nameRule = makePropertyRule({
            "@id": "prop-name",
            label: "name",
            minCount: 1,
            options: ["a", "b"],
            appliesToEntityRules: [thingRule["@id"]]
        })
        const entity: IEntity = { "@id": "e1", "@type": [CREATIVE_WORK] }

        expect(
            checkEntityConformance(
                entity,
                thingRule,
                makeRuleLookup([thingRule], [nameRule]),
                makeCtx([])
            )
        ).toEqual([{ kind: "tooFewPropertyEntries", rule: nameRule, count: 0 }])
    })

    it("reports too many property entries", () => {
        const nameRule = makePropertyRule({
            "@id": "prop-name",
            label: "name",
            maxCount: 1,
            appliesToEntityRules: [thingRule["@id"]]
        })
        const entity: IEntity = { "@id": "e1", "@type": [CREATIVE_WORK], name: ["x", "y"] }

        expect(
            checkEntityConformance(
                entity,
                thingRule,
                makeRuleLookup([thingRule], [nameRule]),
                makeCtx([])
            )
        ).toEqual([{ kind: "tooManyPropertyEntries", rule: nameRule, count: 2 }])
    })

    it("reports invalid string options with their index", () => {
        const statusRule = makePropertyRule({
            "@id": "prop-status",
            label: "status",
            options: ["a", "b"],
            appliesToEntityRules: [thingRule["@id"]]
        })
        const entity: IEntity = { "@id": "e1", "@type": [CREATIVE_WORK], status: ["a", "c"] }

        expect(
            checkEntityConformance(
                entity,
                thingRule,
                makeRuleLookup([thingRule], [statusRule]),
                makeCtx([])
            )
        ).toEqual([{ kind: "invalidPropertyOption", rule: statusRule, index: 1 }])
    })

    it("reports invalid reference options with their index", () => {
        const statusRule = makePropertyRule({
            "@id": "prop-status",
            label: "status",
            options: [{ "@id": PERSON }],
            appliesToEntityRules: [thingRule["@id"]]
        })
        const entity: IEntity = {
            "@id": "e1",
            "@type": [CREATIVE_WORK],
            status: [{ "@id": ORGANIZATION }]
        }

        expect(
            checkEntityConformance(
                entity,
                thingRule,
                makeRuleLookup([thingRule], [statusRule]),
                makeCtx([])
            )
        ).toEqual([{ kind: "invalidPropertyOption", rule: statusRule, index: 0 }])
    })

    it("reports too few property value matches", () => {
        const valueRule = makePropertyValueRule({
            "@id": "value-readonly",
            value: "https://example.org/readonly",
            minCount: 2
        })
        const accessRule = makePropertyRule({
            "@id": "prop-access",
            label: "access",
            rangeIncludes: [valueRule["@id"]],
            appliesToEntityRules: [thingRule["@id"]]
        })
        const entity: IEntity = {
            "@id": "e1",
            "@type": [CREATIVE_WORK],
            access: ["https://example.org/readonly", "https://example.org/write"]
        }

        expect(
            checkEntityConformance(
                entity,
                thingRule,
                makeRuleLookup([thingRule], [accessRule], [valueRule]),
                makeCtx([])
            )
        ).toEqual([
            { kind: "tooFewPropertyValues", propertyRule: accessRule, rule: valueRule, count: 1 }
        ])
    })

    it("reports too many property value matches with their indices", () => {
        const valueRule = makePropertyValueRule({
            "@id": "value-readonly",
            value: "https://example.org/readonly",
            maxCount: 1
        })
        const accessRule = makePropertyRule({
            "@id": "prop-access",
            label: "access",
            rangeIncludes: [valueRule["@id"]],
            appliesToEntityRules: [thingRule["@id"]]
        })
        const entity: IEntity = {
            "@id": "e1",
            "@type": [CREATIVE_WORK],
            access: ["https://example.org/readonly", "https://example.org/readonly"]
        }

        expect(
            checkEntityConformance(
                entity,
                thingRule,
                makeRuleLookup([thingRule], [accessRule], [valueRule]),
                makeCtx([])
            )
        ).toEqual([
            {
                kind: "tooManyPropertyValues",
                propertyRule: accessRule,
                rule: valueRule,
                indices: [0, 1]
            }
        ])
    })

    it("reports a reference whose target type matches no range entity rule", () => {
        const authorRule = makePropertyRule({
            "@id": "prop-author",
            label: "author",
            rangeIncludes: [personTargetRule["@id"]],
            appliesToEntityRules: [thingRule["@id"]]
        })
        const entity: IEntity = {
            "@id": "e1",
            "@type": [CREATIVE_WORK],
            author: [{ "@id": "org-1" }]
        }
        const org: IEntity = { "@id": "org-1", "@type": [ORGANIZATION] }

        expect(
            checkEntityConformance(
                entity,
                thingRule,
                makeRuleLookup([thingRule, personTargetRule], [authorRule]),
                makeCtx([org])
            )
        ).toEqual([
            {
                kind: "mismatchingReferenceType",
                rule: authorRule,
                index: 0,
                expectedRules: [personTargetRule]
            }
        ])
    })

    it("accepts a reference whose target type matches a range entity rule", () => {
        const authorRule = makePropertyRule({
            "@id": "prop-author",
            label: "author",
            rangeIncludes: [personTargetRule["@id"]],
            appliesToEntityRules: [thingRule["@id"]]
        })
        const entity: IEntity = {
            "@id": "e1",
            "@type": [CREATIVE_WORK],
            author: [{ "@id": "p-1" }]
        }
        const person: IEntity = { "@id": "p-1", "@type": ["Person"] }

        expect(
            checkEntityConformance(
                entity,
                thingRule,
                makeRuleLookup([thingRule, personTargetRule], [authorRule]),
                makeCtx([person])
            )
        ).toEqual([])
    })

    it("accepts a reference target that is already assigned to a range entity rule", () => {
        const authorRule = makePropertyRule({
            "@id": "prop-author",
            label: "author",
            rangeIncludes: [personTargetRule["@id"]],
            appliesToEntityRules: [thingRule["@id"]]
        })
        const entity: IEntity = {
            "@id": "e1",
            "@type": [CREATIVE_WORK],
            author: [{ "@id": "p-1" }]
        }
        const org: IEntity = { "@id": "p-1", "@type": [ORGANIZATION] }

        expect(
            checkEntityConformance(
                entity,
                thingRule,
                makeRuleLookup([thingRule, personTargetRule], [authorRule]),
                makeCtx(
                    [org],
                    (entityId, entityRuleId) =>
                        entityId === "p-1" && entityRuleId === personTargetRule["@id"]
                )
            )
        ).toEqual([])
    })

    it("ignores references to entities that do not exist in the graph", () => {
        const authorRule = makePropertyRule({
            "@id": "prop-author",
            label: "author",
            rangeIncludes: [personTargetRule["@id"]],
            appliesToEntityRules: [thingRule["@id"]]
        })
        const entity: IEntity = {
            "@id": "e1",
            "@type": [CREATIVE_WORK],
            author: [{ "@id": "ghost" }]
        }

        expect(
            checkEntityConformance(
                entity,
                thingRule,
                makeRuleLookup([thingRule, personTargetRule], [authorRule]),
                makeCtx([])
            )
        ).toEqual([])
    })

    it("accepts any reference target for range rules without specializationOf", () => {
        const partRule = makePropertyRule({
            "@id": "prop-part",
            label: "hasPart",
            rangeIncludes: [openRule["@id"]],
            appliesToEntityRules: [thingRule["@id"]]
        })
        const entity: IEntity = {
            "@id": "e1",
            "@type": [CREATIVE_WORK],
            hasPart: [{ "@id": "org-1" }]
        }
        const org: IEntity = { "@id": "org-1", "@type": [ORGANIZATION] }

        expect(
            checkEntityConformance(
                entity,
                thingRule,
                makeRuleLookup([thingRule, openRule], [partRule]),
                makeCtx([org])
            )
        ).toEqual([])
    })
})
