import z, { ZodError } from "zod"

const SpringErrorSchema = z.object({
    timestamp: z.number(),
    status: z.number(),
    error: z.string(),
    trace: z.string().optional(),
    message: z.string(),
    path: z.string()
})

/**
 * Handler for any kind of error that is caught somewhere
 * Specifically good at handling Spring REST errors
 * Can also handle any instance of Error
 * @param e The error that will be turned into a string
 */
export function handleSpringError(e: unknown) {
    if (typeof e === "string") return e
    if (e instanceof Error) return `${e.message} (type: ${e.name})`

    try {
        const springError = SpringErrorSchema.parse(e)
        delete springError.trace
        console.warn("Caught Spring Error", springError)
        return `ro-crate-rest: ${springError.message} (code: ${springError.status})`
    } catch (zodError) {
        if (zodError instanceof ZodError) {
            if (e && typeof e === "object") {
                try {
                    return JSON.stringify(e)
                } catch (_) {
                    console.log(e)
                    return e.toString()
                }
            } else {
                return e + ""
            }
        } else {
            console.error(
                "errorToString failed. First object is root cause, second object is errorToString exception",
                e,
                zodError
            )
            return "Internal Editor Exception"
        }
    }
}
