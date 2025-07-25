import z from "zod"

export const schemaFileSchema = z.object({
    "@context": z.any(),
    "@graph": z.array(
        z.intersection(
            z.object({ "@id": z.string(), "@type": z.string().or(z.string().array()) }),
            z.record(z.string(), z.unknown())
        )
    )
})

export type SchemaFile = z.infer<typeof schemaFileSchema>
