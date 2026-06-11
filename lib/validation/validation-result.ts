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
    ruleName: z.string().check(z.describe("The name of the rule that produced this result"))
})

export type ValidationResult = z.infer<typeof ValidationResultSchema>
