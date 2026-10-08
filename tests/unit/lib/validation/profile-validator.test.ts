/**
 * @jest-environment jsdom
 */
import { ProfileValidator } from "@/lib/validation/validators/profile-validator"
import { ValidatorContext } from "@/lib/validation/validator"
import { IProfileHandler } from "@/lib/core/profiles/IProfileHandler"
import { ProfileDefinition } from "@/lib/core/profiles/types/ProfileDefinition"
import { EntityRule } from "@/lib/core/profiles/types/EntityRule"
import { IContextResolverService } from "@/lib/core/IContextResolverService"
import { ValidationResultSeverity } from "@/lib/validation/validation-result"
import { EditorState } from "@/lib/state/editor-state"
import { RO_CRATE_VERSION } from "@/lib/constants"

if (typeof structuredClone === "undefined") {
    ;(globalThis as any).structuredClone = <T>(v: T): T => JSON.parse(JSON.stringify(v))
}

// The real module pulls in browser-only persistence code (happy-opfs) through its import chain.
// Its getDefaultValue is only used to build fix actions, which these tests do not exercise.
jest.mock("@/lib/core/profiles/impl/util/create-minimum-viable-entity", () => ({
    getDefaultValue: jest.fn()
}))

const PERSON = "https://schema.org/Person"
const DATASET = "https://schema.org/Dataset"

const personRule: EntityRule = {
    "@id": PERSON,
    onHandler: "handler-1",
    onProfile: "https://example.org/profile",
    specializationOf: [PERSON],
    name: "Person"
}
const datasetRule: EntityRule = {
    "@id": DATASET,
    onHandler: "handler-1",
    onProfile: "https://example.org/profile",
    specializationOf: [DATASET],
    name: "Dataset"
}

const definition: ProfileDefinition = {
    "@id": "https://example.org/profile",
    onHandler: "handler-1",
    name: "Test Profile",
    specification: RO_CRATE_VERSION.V1_1_3,
    entityRules: [personRule, datasetRule],
    propertyRules: [],
    propertyValueRules: []
}

const resolver: IContextResolverService = {
    resolve: (id) => ({ Person: PERSON, Dataset: DATASET })[id] ?? null,
    reverse: () => null
}

function makeHandler(mapping: Map<string, string>, isReady = true): IProfileHandler {
    return {
        id: "handler-1",
        name: "Test",
        profileUri: definition["@id"],
        getIsReady: () => isReady,
        getErrors: () => [],
        getDefinition: () => definition,
        updateEntityMapping: () => {},
        getEntityMapping: () => new Map(mapping),
        getEntityRule: (id: string) => definition.entityRules.find((rule) => rule["@id"] === id),
        getPropertyRule: () => undefined,
        getPropertyValueRule: () => undefined,
        getPropertyRulesFor: () => [],
        attach: () => {},
        discard: () => {}
    } as unknown as IProfileHandler
}

function makeContext(entities: IEntity[]): ValidatorContext {
    const entityMap = new Map(entities.map((entity) => [entity["@id"], entity]))
    return {
        editorState: { getEntities: () => entityMap } as unknown as EditorState,
        profileService: {} as ValidatorContext["profileService"],
        schemaWorker: { worker: {} } as ValidatorContext["schemaWorker"],
        resolver,
        context: {} as ValidatorContext["context"]
    }
}

function makeValidator(
    entities: IEntity[],
    mapping: Map<string, string> = new Map(),
    isReady = true
) {
    return new ProfileValidator(makeHandler(mapping, isReady), makeContext(entities))
}

const crate = { "@context": [], "@graph": [] } as unknown as ICrate

describe("ProfileValidator unassigned profile entities", () => {
    it("warns for an unmapped entity whose types match an entity rule", async () => {
        const validator = makeValidator([{ "@id": "person-1", "@type": ["Person"] }])

        const results = await validator.validateCrate(crate)

        expect(results).toHaveLength(1)
        expect(results[0].ruleName).toBe("unassignedProfileEntity")
        expect(results[0].entityId).toBe("person-1")
        expect(results[0].resultSeverity).toBe(ValidationResultSeverity.softWarning)
        expect(results[0].resultTitle).toBe("This entity is not assigned to a profile rule")
        expect(results[0].resultDescription).toContain("`Person`")
        expect(results[0].resultDescription).toContain("Test Profile")
    })

    it("does not warn for entities that are mapped", async () => {
        const mapping = new Map([["person-1", PERSON]])
        const validator = makeValidator([{ "@id": "person-1", "@type": ["Person"] }], mapping)

        const results = await validator.validateCrate(crate)

        expect(results).toEqual([])
    })

    it("does not warn for entities whose types match no entity rule", async () => {
        const validator = makeValidator([{ "@id": "org-1", "@type": ["Organization"] }])

        const results = await validator.validateCrate(crate)

        expect(results).toEqual([])
    })

    it("warns for each unassigned matching entity", async () => {
        const validator = makeValidator([
            { "@id": "person-1", "@type": ["Person"] },
            { "@id": "person-2", "@type": [PERSON] },
            { "@id": "dataset-1", "@type": ["Dataset"] }
        ])

        const results = await validator.validateCrate(crate)

        expect(results).toHaveLength(3)
        expect(results.map((r) => r.entityId)).toEqual(["person-1", "person-2", "dataset-1"])
    })

    it("does not warn for an entity that only matches a rule without specializationOf", async () => {
        const openRule: EntityRule = {
            "@id": "https://example.org/rules#Open",
            onHandler: "handler-1",
            onProfile: "https://example.org/profile",
            name: "Open"
        }
        const definitionWithOpenRule: ProfileDefinition = {
            ...definition,
            entityRules: [personRule, datasetRule, openRule]
        }
        const validator = new ProfileValidator(
            {
                ...makeHandler(new Map()),
                getDefinition: () => definitionWithOpenRule
            },
            makeContext([{ "@id": "file-1", "@type": ["https://schema.org/File"] }])
        )

        const results = await validator.validateCrate(crate)

        expect(results).toEqual([])
    })

    it("does not warn when the profile is not ready", async () => {
        const validator = makeValidator(
            [{ "@id": "person-1", "@type": ["Person"] }],
            new Map(),
            false
        )

        const results = await validator.validateCrate(crate)

        expect(results).toEqual([])
    })
})
