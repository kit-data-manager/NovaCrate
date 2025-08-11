export interface ValidationResult {
    id: string

    entityId?: string
    propertyName?: string
    propertyIndex?: number

    resultSeverity: ValidationResultSeverity
    resultTitle: string
    resultDescription: string

    actions?: ValidationResultAction[]
    helpUrl?: string

    validatorName: string
    ruleName: string
}

export enum ValidationResultSeverity {
    error = 3,
    warning = 2,
    softWarning = 1,
    info = 0
}

export interface ValidationResultAction {
    name: string
    displayName: string
    dispatch: () => void
}
