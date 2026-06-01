import { tool } from "ai"
import { z } from "zod/mini"
import { EntitySchema } from "@/lib/utils"

const readEntityTool = tool({
    description:
        "Read the metadata of a specific entity. If the entity does not exist, returns nothing.",
    inputSchema: z.object({
        entityId: z.string()
    }),
    outputSchema: z.optional(EntitySchema)
})

const editEntityTool = tool({
    description:
        "Edit a specific metadata entity. If the edit succeeded, returns the new entity. If the edit failed, returns nothing",
    inputSchema: z.object({
        entityId: z.string(),
        content: EntitySchema
    }),
    outputSchema: z.optional(EntitySchema)
})

export const tools = { readEntityTool, editEntityTool }
