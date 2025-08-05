import { ValidationResult } from "@/lib/validation/validation-result"

export interface Validator {
    name: string
    validateCrate(crate: ICrate): Promise<ValidationResult[]>
    validateEntity(entity: IEntity): Promise<ValidationResult[]>
    validateProperty(entity: IEntity, propertyName: string): Promise<ValidationResult[]>
}
