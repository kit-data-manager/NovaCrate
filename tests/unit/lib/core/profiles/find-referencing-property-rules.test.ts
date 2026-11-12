import {
    findReferencingPropertyRules,
    ReferencingPropertyRule
} from "@/lib/core/profiles/impl/util/find-referencing-property-rules"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { PropertyRule } from "@/lib/core/profiles/types/PropertyRule"
import { PropertyValueRule } from "@/lib/core/profiles/types/PropertyValueRule"
import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"

const TARGET_RULE: EntityRule = {
    "@id": "https://example.org/rules#Person",
    onHandler: "handler",
    onProfile: "profile",
    specializationOf: ["https://schema.org/Person"],
    name: "Person"
}

const OTHER_RULE: EntityRule = {
    "@id": "https://example.org/rules#Dataset",
    onHandler: "handler",
    onProfile: "profile"
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

function makeHandler(
    propertyRules: PropertyRule[],
    propertyValueRules: PropertyValueRule[] = [],
    isReady = true
): IProfileHandler {
    const entityRules = [TARGET_RULE, OTHER_RULE]
    const handler = {
        id: "handler",
        name: "TestHandler",
        getDefinition: () => ({
            "@id": "profile",
            onHandler: "handler",
            name: "Test Profile",
            specification: "1.2",
            entityRules,
            propertyRules,
            propertyValueRules
        }),
        getIsReady: () => isReady,
        getEntityRule: (id: string) => entityRules.find((rule) => rule["@id"] === id),
        getPropertyValueRule: (id: string) =>
            propertyValueRules.find((rule) => rule["@id"] === id)
    }
    return handler as unknown as IProfileHandler
}

describe("findReferencingPropertyRules", () => {
    it("finds property rules that include the entity rule directly in their range", () => {
        const directRule = makePropertyRule({
            "@id": "prop-direct",
            label: "author",
            appliesToEntityRules: [OTHER_RULE["@id"]],
            rangeIncludes: [TARGET_RULE["@id"]]
        })

        const results = findReferencingPropertyRules(TARGET_RULE, [makeHandler([directRule])])

        expect(results).toHaveLength(1)
        expect(results[0].propertyRule["@id"]).toBe("prop-direct")
        expect(results[0].appliesToEntityRules).toEqual([OTHER_RULE])
    })

    it("finds property rules referencing the entity rule indirectly via a property value rule", () => {
        const valueRule = makePropertyValueRule({
            "@id": "value-rule",
            value: { "@id": TARGET_RULE["@id"] }
        })
        const indirectRule = makePropertyRule({
            "@id": "prop-indirect",
            label: "publisher",
            appliesToEntityRules: [OTHER_RULE["@id"]],
            rangeIncludes: [valueRule["@id"]]
        })

        const results = findReferencingPropertyRules(TARGET_RULE, [
            makeHandler([indirectRule], [valueRule])
        ])

        expect(results).toHaveLength(1)
        expect(results[0].propertyRule["@id"]).toBe("prop-indirect")
    })

    it("ignores property value rules with string values", () => {
        const valueRule = makePropertyValueRule({ "@id": "value-rule", value: "some string" })
        const propertyRule = makePropertyRule({
            "@id": "prop-indirect",
            label: "publisher",
            appliesToEntityRules: [OTHER_RULE["@id"]],
            rangeIncludes: [valueRule["@id"]]
        })

        expect(findReferencingPropertyRules(TARGET_RULE, [makeHandler([propertyRule])])).toEqual([])
    })

    it("excludes property rules with options, since options take precedence over rangeIncludes", () => {
        const optionsRule = makePropertyRule({
            "@id": "prop-options",
            label: "@id",
            appliesToEntityRules: [OTHER_RULE["@id"]],
            options: ["ro-crate-metadata.json"],
            rangeIncludes: [TARGET_RULE["@id"]]
        })

        expect(findReferencingPropertyRules(TARGET_RULE, [makeHandler([optionsRule])])).toEqual([])
    })

    it("ignores rules of other entity rules and handlers that are not ready", () => {
        const unrelatedRule = makePropertyRule({
            "@id": "prop-unrelated",
            label: "name",
            appliesToEntityRules: [OTHER_RULE["@id"]],
            rangeIncludes: [OTHER_RULE["@id"]]
        })

        expect(findReferencingPropertyRules(TARGET_RULE, [makeHandler([unrelatedRule])])).toEqual([])
        expect(
            findReferencingPropertyRules(TARGET_RULE, [makeHandler([unrelatedRule], [], false)])
        ).toEqual([])
    })

    it("collects results across multiple handlers", () => {
        const ruleA = makePropertyRule({
            "@id": "prop-a",
            label: "author",
            appliesToEntityRules: [OTHER_RULE["@id"]],
            rangeIncludes: [TARGET_RULE["@id"]]
        })
        const ruleB = makePropertyRule({
            "@id": "prop-b",
            label: "publisher",
            appliesToEntityRules: [OTHER_RULE["@id"]],
            rangeIncludes: [TARGET_RULE["@id"]]
        })
        const handlerA = makeHandler([ruleA])
        const handlerB = { ...makeHandler([ruleB]), id: "handler-b" } as IProfileHandler

        const results: ReferencingPropertyRule[] = findReferencingPropertyRules(TARGET_RULE, [
            handlerA,
            handlerB
        ])

        expect(results.map((r) => r.propertyRule["@id"])).toEqual(["prop-a", "prop-b"])
    })
})
