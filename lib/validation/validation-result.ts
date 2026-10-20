import { z } from "zod/mini"

export enum ValidationResultSeverity {
    error = 3,
    warning = 2,
    softWarning = 1,
    info = 0
}

export const ValidationResultSchema = z.object({
    id: z.string().check(z.describe("The internal identifier of this validation result")),

    entityId: z
        .optional(z.string())
        .check(z.describe("The identifier of the entity this result is for")),
    propertyName: z
        .optional(z.string())
        .check(z.describe("The name of the property this result is for (relative to entityId)")),
    propertyIndex: z
        .optional(z.number())
        .check(
            z.describe(
                "The index of the property this result is for (relative to propertyName and entityId)"
            )
        ),

    resultSeverity: z
        .enum(ValidationResultSeverity)
        .check(z.describe("The severity of the validation result")),
    resultTitle: z.string().check(z.describe("The title of the validation result")),
    resultDescription: z.string().check(z.describe("The description of the validation result")),

    actions: z
        .optional(
            z.array(
                z.object({
                    name: z.string(),
                    displayName: z.string(),
                    dispatch: z.function()
                })
            )
        )
        .check(z.describe("The actions that can be taken for this validation result")),
    helpUrl: z
        .optional(z.string())
        .check(z.describe("The URL to a help page for this validation result")),

    validatorName: z
        .string()
        .check(z.describe("The name of the validator that produced this result")),
    ruleName: z.string().check(z.describe("The name of the rule that produced this result")),
    trace: z
        .object({
            entityId: z.union([z.null(), z.string()]),
            propertyName: z.union([z.null(), z.string()])
        })
        .check(
            z.describe(
                "Used internally by the validation provider to trace which results were created by which rule invocation"
            )
        )
})

/**
 * This is the type that should be used by all validator implementations. The base ValidationResult is only used internally in the Validation Provider
 */
export const ValidationResultWithoutTraceSchema = z.omit(ValidationResultSchema, {
    trace: true
})

export type ValidationResult = z.infer<typeof ValidationResultSchema>
export type ValidationResultWithoutTrace = z.infer<typeof ValidationResultWithoutTraceSchema>
