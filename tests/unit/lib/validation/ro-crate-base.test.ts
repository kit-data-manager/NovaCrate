import { RO_CRATE_VERSION } from "@/lib/constants"
import { RoCrateBase } from "@/lib/validation/validators/rules/ro-crate-base"
import { ValidatorContext } from "@/lib/validation/validator"

function buildContext(): ValidatorContext {
    return {
        editorState: {
            crateContext: {
                specification: RO_CRATE_VERSION.V1_2_0,
                context: "https://w3id.org/ro/crate/1.2/context",
                customPairs: {},
                fallbackActive: false
            }
        } as unknown as ValidatorContext["editorState"],
        schemaWorker: {} as ValidatorContext["schemaWorker"],
        resolver: {} as ValidatorContext["resolver"],
        context: {
            getRaw() {
                return "https://w3id.org/ro/crate/1.2/context"
            }
        } as ValidatorContext["context"],
        profileService: {} as ValidatorContext["profileService"]
    }
}

describe("RoCrateBase", () => {
    describe("crateRules", () => {
        it("accepts matching RO-Crate versions in metadata conformsTo and @context", async () => {
            const [rule] = RoCrateBase.crateRules(buildContext())

            const results = await rule({
                "@context": "https://w3id.org/ro/crate/1.2/context",
                "@graph": [
                    {
                        "@id": "ro-crate-metadata.json",
                        "@type": "CreativeWork",
                        conformsTo: [{ "@id": "https://w3id.org/ro/crate/1.2" }]
                    }
                ]
            })

            expect(results).toHaveLength(0)
        })
    })

    describe("propertyRules", () => {
        it("warns when metadata conformsTo references a different RO-Crate version than @context", async () => {
            const rules = RoCrateBase.propertyRules(buildContext())

            const results = await rules[2](
                {
                    "@id": "ro-crate-metadata.json",
                    "@type": "CreativeWork",
                    conformsTo: { "@id": "https://w3id.org/ro/crate/1.1" }
                },
                "conformsTo"
            )

            expect(results).toHaveLength(1)
            expect(results[0]).toMatchObject({
                ruleName: "metadataEntityConformsToContextMismatch",
                resultTitle: "Mismatching RO-Crate specification version"
            })
        })
    })
})
