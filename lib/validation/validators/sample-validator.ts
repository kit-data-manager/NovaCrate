import { ValidationResult, ValidationResultSeverity } from "../validation-result"
import { Validator } from "../validator"

/**
 * Example validator that returns issues for everything that is checked with it. Can be used to debug the validation UI
 */
export class SampleValidator extends Validator {
    name = "SampleValidator"

    async validateProperty(entity: IEntity, propertyName: string): Promise<ValidationResult[]> {
        const values = entity[propertyName]
        const results: ValidationResult[] = []

        if (Array.isArray(values)) {
            for (let i = 0; i < values.length; i++) {
                results.push({
                    id: crypto.randomUUID(),
                    entityId: entity["@id"],
                    propertyName,
                    propertyIndex: i,
                    validatorName: this.name,
                    resultTitle: "Test result (Property)",
                    resultDescription: "This result is just a test",
                    resultSeverity: ValidationResultSeverity.error
                })
            }
        } else {
            results.push({
                id: crypto.randomUUID(),
                entityId: entity["@id"],
                propertyName,
                validatorName: this.name,
                resultTitle: "Linked entity does not match expected type",
                resultDescription:
                    "This property should be linked to an entity of type Person, but it is linked to an entity of type Organization.",
                resultSeverity: ValidationResultSeverity.info,
                actions: [
                    {
                        name: "test",
                        displayName: "Test",
                        dispatch: () => {
                            alert("Hello")
                        }
                    },
                    {
                        name: "test",
                        displayName: "Test",
                        dispatch: () => {
                            alert("Hello")
                        }
                    }
                ]
            })
        }

        return results
    }

    async validateEntity(entity: IEntity): Promise<ValidationResult[]> {
        return [
            {
                id: crypto.randomUUID(),
                entityId: entity["@id"],
                validatorName: this.name,
                resultTitle: "Test result (Entity)",
                resultDescription: "This result is just a test for entity validation",
                resultSeverity: ValidationResultSeverity.warning
            }
        ]
    }

    async validateCrate(): Promise<ValidationResult[]> {
        return [
            {
                id: crypto.randomUUID(),
                validatorName: this.name,
                resultTitle: "Test result (Crate)",
                resultDescription: "This result is just a test for crate validation",
                resultSeverity: ValidationResultSeverity.warning
            }
        ]
    }
}
