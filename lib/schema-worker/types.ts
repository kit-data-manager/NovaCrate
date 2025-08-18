import * as z from "zod/mini"

export const schemaFileSchema = z.object({
    "@context": z.any(),
    "@graph": z.array(
        z.intersection(
            z.object({ "@id": z.string(), "@type": z.union([z.string(), z.array(z.string())]) }),
            z.record(z.string(), z.unknown())
        )
    )
})

export type SchemaFile = z.infer<typeof schemaFileSchema>
