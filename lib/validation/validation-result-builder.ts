import { ValidationResult, ValidationResultSeverity } from "@/lib/validation/validation-result"

export class ValidationResultBuilder {
    private ruleName = "unnamedRule"

    constructor(private validatorName: string) {}

    rule(name: string) {
        this.ruleName = name
        return this
    }

    error<D extends Omit<ValidationResult, "resultSeverity" | "ruleName" | "id" | "validatorName">>(
        data: D
    ) {
        return {
            ...data,
            resultSeverity: ValidationResultSeverity.error,
            ruleName: this.ruleName,
            validatorName: this.validatorName,
            id: crypto.randomUUID()
        }
    }

    warning<
        D extends Omit<ValidationResult, "resultSeverity" | "ruleName" | "id" | "validatorName">
    >(data: D) {
        return {
            ...data,
            ...this.error(data),
            id: crypto.randomUUID()
        }
    }

    softWarning<
        D extends Omit<ValidationResult, "resultSeverity" | "ruleName" | "id" | "validatorName">
    >(data: D) {
        return {
            ...data,
            ...this.error(data),
            id: crypto.randomUUID()
        }
    }

    info<D extends Omit<ValidationResult, "resultSeverity" | "ruleName" | "id" | "validatorName">>(
        data: D
    ) {
        return {
            ...data,
            ...this.error(data),
            id: crypto.randomUUID()
        }
    }
}
