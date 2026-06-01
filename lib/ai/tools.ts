import { tool } from "ai"
import { z } from "zod/mini"
import { EntitySchema } from "@/lib/utils"

const readEntity = tool({
    description:
        "Read the metadata of a specific entity. If the entity does not exist, returns nothing.",
    inputSchema: z.object({
        entityId: z.string()
    }),
    outputSchema: z.optional(EntitySchema)
})

const editEntity = tool({
    description:
        "Edit a specific metadata entity. If the edit succeeded, returns the new entity. If the edit failed, returns nothing",
    inputSchema: z.object({
        entityId: z.string(),
        content: EntitySchema
    }),
    outputSchema: z.optional(EntitySchema)
})

const createEntity = tool({
    description:
        "Create a new metadata entity. You need to provide the full metadata for this entity, with mandatory @id and @type attributes. An entity with the same @id must not exist yet. If the creation succeeded, returns the new entity. If the creation failed, returns nothing",
    inputSchema: z.object({
        content: EntitySchema
    }),
    outputSchema: z.optional(EntitySchema)
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

export const tools = {
    readEntity,
    editEntity,
    createEntity,
    getMetadataSummary,
    getFilesList
}
