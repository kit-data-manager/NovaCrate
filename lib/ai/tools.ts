import { tool } from "ai"
import { z } from "zod/mini"

const readEntityTool = tool({
    description: "Read the metadata of a specific entity",
    inputSchema: z.object({
        entityId: z.string()
    }),
    execute: async ({ entityId }) => {
        return { "@id": entityId, "@type": "File", author: "#christopher", license: "Apache-2.0" }
    }
})

const editEntityTool = tool({
    description: "Edit a specific metadata entity",
    inputSchema: z.object({
        entityId: z.string(),
        content: z.json()
    }),
    execute: async ({ entityId, content }) => {
        console.log("edit entity executed", entityId, content)
    }
})

export { readEntityTool, editEntityTool }
