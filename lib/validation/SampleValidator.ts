import { ValidationResult, Validator } from "@/lib/validation/ValidationProvider"

export class SampleValidator implements Validator {
    name = "SampleValidator"

    validateProperty(entity: IEntity, propertyName: string): ValidationResult[] {
        const values = entity[propertyName]
        const results: ValidationResult[] = []

        if (Array.isArray(values)) {
            for (let i = 0; i < values.length; i++) {
                results.push({
                    entityId: entity["@id"],
                    propertyName,
                    propertyIndex: i,
                    validatorName: this.name,
                    resultTitle: "Test result (Property)",
                    resultDescription: "This result is just a test",
                    resultType: "warning"
                })
            }
        } else {
            console.log("Returning validation for ", propertyName)
            results.push({
                entityId: entity["@id"],
                propertyName,
                validatorName: this.name,
                resultTitle: "Test result (Property)",
                resultDescription:
                    "This property should be linked to an entity of type Person, but it is linked to an entity of type Organization.",
                resultType: "info",
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

    validateEntity(entity: IEntity): ValidationResult[] {
        return [
            {
                entityId: entity["@id"],
                validatorName: this.name,
                resultTitle: "Test result (Entity)",
                resultDescription: "This result is just a test for entity validation",
                resultType: "warning"
            }
        ]
    }

    validateCrate(): ValidationResult[] {
        return [
            {
                validatorName: this.name,
                resultTitle: "Test result (Crate)",
                resultDescription: "This result is just a test for crate validation",
                resultType: "warning"
            }
        ]
    }
}
