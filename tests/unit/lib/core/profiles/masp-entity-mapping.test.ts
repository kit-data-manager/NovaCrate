import { MASPProfileHandler } from "@/lib/core/profiles/impl/masp/MASPProfileHandler"
import { IContextResolverService } from "@/lib/core/IContextResolverService"

const NS = "https://example.org/profile#"
const METADATA_RULE = NS + "MetadataDescriptor"
const DATASET_RULE = NS + "Dataset"
const COMPLEX_RULE = NS + "ComplexThing"
const SIMPLE_RULE = NS + "SimpleThing"
const PERSON_RULE = NS + "Person"

const DATASET = "https://schema.org/Dataset"
const CREATIVE_WORK = "https://schema.org/CreativeWork"
const PERSON = "https://schema.org/Person"

// A minimal MASP profile: a Dataset rule that can hold "ComplexThing" (requires two "creator"
// entries and one "description" entry) or "SimpleThing" (requires one "name" entry).
const profileEntities: IEntity[] = [
    {
        "@id": METADATA_RULE,
        "@type": ["rdfs:Class"],
        "rdfs:label": "Metadata Descriptor"
    },
    {
        "@id": DATASET_RULE,
        "@type": ["rdfs:Class"],
        "prov:specializationOf": { "@id": DATASET },
        "rdfs:label": "Dataset"
    },
    {
        "@id": COMPLEX_RULE,
        "@type": ["rdfs:Class"],
        "prov:specializationOf": { "@id": CREATIVE_WORK },
        "rdfs:label": "Complex Thing"
    },
    {
        "@id": SIMPLE_RULE,
        "@type": ["rdfs:Class"],
        "prov:specializationOf": { "@id": CREATIVE_WORK },
        "rdfs:label": "Simple Thing"
    },
    {
        "@id": PERSON_RULE,
        "@type": ["rdfs:Class"],
        "prov:specializationOf": { "@id": PERSON },
        "rdfs:label": "Person"
    },
    {
        "@id": NS + "metadata-id-value",
        "@type": ["PropertyValue"],
        value: "ro-crate-metadata.json"
    },
    {
        "@id": NS + "special-value",
        "@type": ["PropertyValue"],
        value: { "@id": COMPLEX_RULE }
    },
    {
        "@id": NS + "id-prop",
        "@type": ["rdf:Property"],
        "rdfs:label": "@id",
        domainIncludes: [{ "@id": METADATA_RULE }],
        rangeIncludes: [{ "@id": NS + "metadata-id-value" }]
    },
    {
        "@id": NS + "about-prop",
        "@type": ["rdf:Property"],
        "rdfs:label": "about",
        domainIncludes: [{ "@id": METADATA_RULE }],
        rangeIncludes: [{ "@id": DATASET_RULE }]
    },
    {
        "@id": NS + "hasPart-prop",
        "@type": ["rdf:Property"],
        "rdfs:label": "hasPart",
        domainIncludes: [{ "@id": DATASET_RULE }],
        rangeIncludes: [{ "@id": COMPLEX_RULE }, { "@id": SIMPLE_RULE }]
    },
    {
        "@id": NS + "special-part-prop",
        "@type": ["rdf:Property"],
        "rdfs:label": "specialPart",
        domainIncludes: [{ "@id": DATASET_RULE }],
        rangeIncludes: [{ "@id": NS + "special-value" }]
    },
    {
        "@id": NS + "creator-prop",
        "@type": ["rdf:Property"],
        "rdfs:label": "creator",
        "sh:minCount": "2",
        domainIncludes: [{ "@id": COMPLEX_RULE }],
        rangeIncludes: [{ "@id": PERSON_RULE }]
    },
    {
        "@id": NS + "description-prop",
        "@type": ["rdf:Property"],
        "rdfs:label": "description",
        "sh:minCount": "1",
        domainIncludes: [{ "@id": COMPLEX_RULE }]
    },
    {
        "@id": NS + "name-prop",
        "@type": ["rdf:Property"],
        "rdfs:label": "name",
        "sh:minCount": "1",
        domainIncludes: [{ "@id": SIMPLE_RULE }]
    }
]

function makeResolver(): IContextResolverService {
    return {
        resolve: () => null,
        reverse: () => null
    }
}

function makeHandler() {
    return new MASPProfileHandler(
        "https://example.org/profile",
        { "@id": "./", "@type": [DATASET] },
        profileEntities,
        makeResolver()
    )
}

function makeCrateEntities(thing: IEntity, extra: IEntity[] = []): IEntity[] {
    return [
        {
            "@id": "ro-crate-metadata.json",
            "@type": [CREATIVE_WORK],
            about: [{ "@id": "./" }]
        },
        {
            "@id": "./",
            "@type": [DATASET],
            hasPart: [{ "@id": thing["@id"] }]
        },
        thing,
        ...extra
    ]
}

let consoleLogSpy: jest.SpyInstance

beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {})
})

afterEach(() => {
    consoleLogSpy.mockRestore()
})

describe("MASPProfileHandler entity assignment", () => {
    it("parses the profile fixture without errors", () => {
        expect(makeHandler().getErrors()).toEqual([])
    })

    it("assigns an entity to the most complex rule it fully conforms to", () => {
        const handler = makeHandler()
        const entities = makeCrateEntities(
            {
                "@id": "https://example.org/thing-1",
                "@type": [CREATIVE_WORK],
                creator: [
                    { "@id": "https://example.org/p-1" },
                    { "@id": "https://example.org/p-2" }
                ],
                description: ["A thing"]
            },
            [
                { "@id": "https://example.org/p-1", "@type": [PERSON] },
                { "@id": "https://example.org/p-2", "@type": [PERSON] }
            ]
        )

        handler.updateEntityMapping(entities)
        const mapping = handler.getEntityMapping()

        expect(mapping.get("https://example.org/thing-1")).toBe(COMPLEX_RULE)
        expect(mapping.get("https://example.org/p-1")).toBe(PERSON_RULE)
        expect(mapping.get("https://example.org/p-2")).toBe(PERSON_RULE)
    })

    it("falls back to the least complex type-matching rule when no rule is fully conformant", () => {
        const handler = makeHandler()
        // The entity matches the types of both rules but violates the property constraints of
        // ComplexThing (creator, description) and SimpleThing (name). The least complex rule
        // (SimpleThing) is used as fallback.
        const entities = makeCrateEntities({
            "@id": "https://example.org/thing-1",
            "@type": [CREATIVE_WORK]
        })

        handler.updateEntityMapping(entities)
        const mapping = handler.getEntityMapping()

        expect(mapping.get("https://example.org/thing-1")).toBe(SIMPLE_RULE)
    })

    it("assigns entities referenced only via property value rules", () => {
        const handler = makeHandler()
        const thing: IEntity = {
            "@id": "https://example.org/thing-2",
            "@type": [CREATIVE_WORK],
            creator: [{ "@id": "https://example.org/p-1" }, { "@id": "https://example.org/p-2" }],
            description: ["A thing"]
        }
        const entities = makeCrateEntities(thing, [
            { "@id": "https://example.org/p-1", "@type": [PERSON] },
            { "@id": "https://example.org/p-2", "@type": [PERSON] }
        ])
        // Remove the direct hasPart reference so the thing is only reachable via the
        // specialPart property, whose range is defined through a property value rule
        const root = entities.find((e) => e["@id"] === "./")!
        delete root["hasPart"]
        root["specialPart"] = [{ "@id": thing["@id"] }]

        handler.updateEntityMapping(entities)
        const mapping = handler.getEntityMapping()

        expect(mapping.get(thing["@id"])).toBe(COMPLEX_RULE)
    })

    it("leaves entities unmapped when no candidate rule matches their types", () => {
        const handler = makeHandler()
        const entities = makeCrateEntities({
            "@id": "https://example.org/thing-1",
            "@type": [PERSON]
        })

        handler.updateEntityMapping(entities)
        const mapping = handler.getEntityMapping()

        expect(mapping.has("https://example.org/thing-1")).toBe(false)
        // The root entity still falls back to the only type-matching rule
        expect(mapping.get("./")).toBe(DATASET_RULE)
    })
})
