import { tool } from "ai"
import { z } from "zod"
import { EntityPropertySchema, EntitySchema } from "@/lib/utils"
import { ValidationResultSchema } from "@/lib/validation/validation-result"

const parseJsonPreprocessor = (value: any, ctx: z.RefinementCtx) => {
    if (typeof value === "string") {
        try {
            return JSON.parse(value)
        } catch (e) {
            ctx.addIssue({
                code: "custom",
                message: (e as Error).message
            })
        }
    }

    return value
}

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
        "Edit a specific metadata entity. Read the metadata entity first before editing it. You can set properties to specific values, you can push values to a property, and you can remove an entire property. To change the identifier of an entity, use the moveEntity tool.",
    inputSchema: z.preprocess(
        parseJsonPreprocessor,
        z.object({
            entityId: z.string(),
            $set: z
                .record(z.string(), EntityPropertySchema)
                .optional()
                .describe(
                    "key-value record of properties to set to specific values. Will either create a new property or overwrite an existing property"
                ),
            $push: z
                .record(z.string(), EntityPropertySchema)
                .optional()
                .describe(
                    "key-value record of properties where the specified values should be added"
                ),
            $delete: z
                .array(z.string())
                .optional()
                .describe("The property names to remove completely")
        })
    ),
    inputExamples: [
        {
            input: {
                entityId: "myFile.json",
                $set: {
                    license: "https://creativecommons.org/licenses/by/4.0/"
                },
                $push: {
                    author: { "@id": "https://orcid.org/0009-0003-2196-9187" }
                },
                $delete: ["description"]
            }
        },
        {
            input: {
                entityId: "myFile.json",
                $push: {
                    url: ["https://kit.edu/", "https://www.kit.edu/"]
                }
            }
        }
    ],
    outputSchema: EntitySchema
})

const moveEntity = tool({
    description:
        "Change the identifier of an entity by specifying the current @id and the new @id. If the entity @id is a path referencing a file in the RO-Crate, this file will also be moved. In this case, both current and new paths must be valid relative file paths.",
    inputSchema: z.object({
        currentEntityId: z.string(),
        newEntityId: z.string()
    }),
    outputSchema: z.object({})
})

const deleteEntity = tool({
    description:
        "Irreversibly remove an entity from the RO-Crate. You can optionally also removed referenced files/folders if there are any. You need to explicitly ask the user for consent for this destructive action.",
    inputSchema: z.object({
        entityId: z.string(),
        deleteData: z
            .boolean()
            .describe(
                "Whether to delete files/folders referenced by the identifier of this entity. This will cause data loss and should be avoided!"
            )
    }),
    outputSchema: z.object({})
})

const importPersonFromORCID = tool({
    description:
        "Import a Person entity by fetching their details from ORCID. You need to provide the ORCID identifier for this. The imported entity is added to the RO-Crate automatically, so the createEntity tool is not necessary.",
    inputSchema: z.object({
        identifier: z.string("A properly formatted ORCID identifier or ORCID URL")
    }),
    outputSchema: EntitySchema
})

const importOrganizationFromROR = tool({
    description:
        "Import an Organization entity by fetching its details from ROR. You need to provide the ROR identifier for this. The imported entity is added to the RO-Crate automatically, so the createEntity tool is not necessary.",
    inputSchema: z.object({
        identifier: z.string().describe("A properly formatted ROR identifier or ROR URL")
    }),
    outputSchema: EntitySchema
})

const createEntity = tool({
    description:
        "Create a new metadata entity. You need to provide the full metadata for this entity, with mandatory @id and @type attributes. An entity with the same @id must not exist yet. If the creation succeeded, returns the new entity. If this entity is created to describe a specific file in the RO-Crate, make sure to set the @id to the file path.",
    inputSchema: z.object({
        content: z.preprocess(parseJsonPreprocessor, EntitySchema)
    }),
    outputSchema: EntitySchema
})

const getMetadataSummary = tool({
    description:
        "Get a list of all metadata entities in the current RO-Crate, together with their @type. The output is a Record<string, string | string[]>, where the key is the entity @id and the value is the @type. This is useful when trying to find an entity with an unknown @id. This also helps to find which types are in use in the metadata.",
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
    moveEntity,
    deleteEntity,
    getMetadataSummary,
    getFilesList,
    readFilePlainText,
    getValidationResults,
    importPersonFromORCID,
    importOrganizationFromROR
}
