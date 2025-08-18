import { ValidationResultSeverity } from "@/lib/validation/validation-result"
import {
    CrateValidationResult,
    EntityValidationResult,
    PropertyValidationResult
} from "@/lib/validation/validators/rule-based-validator"

export class ValidationResultBuilder {
    private ruleName = "unnamedRule"

    constructor(private validatorName: string) {}

    rule(name: string) {
        this.ruleName = name
        return this
    }

    error<D = EntityValidationResult | PropertyValidationResult | CrateValidationResult>(
        data: Omit<D, "resultSeverity" | "ruleName" | "id" | "validatorName">
    ): D {
        return {
            ...data,
            resultSeverity: ValidationResultSeverity.error,
            ruleName: this.ruleName,
            validatorName: this.validatorName,
            id: crypto.randomUUID()
        } as D
    }

    warning<D = EntityValidationResult | PropertyValidationResult | CrateValidationResult>(
        data: Omit<D, "resultSeverity" | "ruleName" | "id" | "validatorName">
    ): D {
        return {
            ...this.error(data),
            resultSeverity: ValidationResultSeverity.warning
        }
    }

    softWarning<D = EntityValidationResult | PropertyValidationResult | CrateValidationResult>(
        data: Omit<D, "resultSeverity" | "ruleName" | "id" | "validatorName">
    ): D {
        return {
            ...this.error(data),
            resultSeverity: ValidationResultSeverity.softWarning
        }
    }

    info<D = EntityValidationResult | PropertyValidationResult | CrateValidationResult>(
        data: Omit<D, "resultSeverity" | "ruleName" | "id" | "validatorName">
    ): D {
        return {
            ...this.error(data),
            resultSeverity: ValidationResultSeverity.info
        }
    }
}
