import { tool } from "ai"
import { z } from "zod"
import { EntitySchema } from "@/lib/utils"
import { ValidationResultSchema } from "@/lib/validation/validation-result"

const readEntity = tool({
    description:
        "Read the metadata of a specific entity. If the entity does not exist, returns nothing.",
    inputSchema: z.object({
        entityId: z.string()
    }),
    outputSchema: EntitySchema
})

const editEntity = tool({
    description:
        "Edit a specific metadata entity. If the edit succeeded, returns the new entity. If the edit failed, returns nothing",
    inputSchema: z.object({
        entityId: z
            .string()
            .describe(
                "The id of the entity you want to edit. You can specify a different id in the content field to change the id"
            ),
        content: EntitySchema
    }),
    outputSchema: EntitySchema
})

const createEntity = tool({
    description:
        "Create a new metadata entity. You need to provide the full metadata for this entity, with mandatory @id and @type attributes. An entity with the same @id must not exist yet. If the creation succeeded, returns the new entity. If this entity is created to describe a specific file in the RO-Crate, make sure to set the @id to the file path and set autoCompleteFromFile to true.",
    inputSchema: z.object({
        content: EntitySchema,
        autoCompleteFromFile: z
            .boolean()
            .describe(
                "If this entity describes a file in the RO-Crate, set this to true to infer some additional attributes from the file system (file size, file encoding). The id of the entity must resolve to the file path in this case."
            )
    }),
    outputSchema: EntitySchema
})

const getMetadataSummary = tool({
    description:
        "Get a list of all metadata entities in the current RO-Crate, together with their @type. The output is a Record<string, string | string[]>, where the key is the entity @id and the value is the @type. This is useful when trying to find an entitity with an unknown @id. This also helps to find which types are in use in the metadata.",
    inputSchema: z.object(),
    outputSchema: z.record(z.string(), z.union([z.string(), z.array(z.string())]))
})

const getFilesList = tool({
    description:
        "Get a list of all files and folders in the current RO-Crate. The output is an array of paths. Folder paths end with a slash /, while file paths don't end with a slash.",
    inputSchema: z.object(),
    outputSchema: z.array(z.string())
})

const readFilePlainText = tool({
    description:
        "Read the content of a file in the RO-Crate. The output is a string. This is suitable for plain text, code, structured data (JSON, YAML, XML, and so on). This is NOT SUITABLE for PDF, PNG, JPG, or other files that can't be read by an LLM without preprocessing.",
    inputSchema: z.object({
        path: z.string().describe("The path to the file relative to the RO-Crate"),
        offset: z
            .number()
            .min(0)
            .describe(
                "The offset in bytes from which to read the file. Use 0 to read from the start. Must be at least 0."
            ),
        limit: z
            .number()
            .min(1)
            .describe(
                "The number of bytes to read from the file at maximum. Always stay below 10000 to keep the context window clean, unless the user forcefully requests to read the full file. Must be at least 1."
            )
    }),
    inputExamples: [
        { input: { path: "series A/experiments/experiment1.txt", offset: 0, limit: 10000 } }
    ],
    outputSchema: z.string()
})

const getValidationResults = tool({
    description:
        "Get errors, warnings, and recommendations from the built-in validation tool. You should call this tool whenever you want to make sure that your own changes are not yielding any errors.",
    inputSchema: z.object({}),
    outputSchema: z.array(ValidationResultSchema)
})

export const tools = {
    readEntity,
    editEntity,
    createEntity,
    getMetadataSummary,
    getFilesList,
    readFilePlainText,
    getValidationResults
}
