import z from "zod"

export const schemaFileSchema = z.object({
    "@context": z.any(),
    "@graph": z.array(
        z.object({ "@id": z.string(), "@type": z.string().or(z.string().array()) }).passthrough()
    )
})

export type SchemaFile = z.infer<typeof schemaFileSchema>
