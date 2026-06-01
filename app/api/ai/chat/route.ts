import { ProviderConfigurationSchema } from "@/lib/state/ai-assistant-settings"
import { createAgentUIStreamResponse, ToolLoopAgent, UIMessage } from "ai"
import { tools } from "@/lib/ai/tools"
import { ProviderFactory } from "@/lib/ai/providers/ProviderFactory"
import { z } from "zod/mini"

export async function POST(req: Request) {
    const body: {
        messages: UIMessage[]
        config: unknown
    } = await req.json()
    const config = z
        .extend(ProviderConfigurationSchema, {
            selectedModel: z.string()
        })
        .parse(body.config)

    const provider = new ProviderFactory().makeAdapter(config)
    const model = await provider.getLanguageModel(config.selectedModel)

    const agent = new ToolLoopAgent({
        model,
        tools,
        instructions:
            "You are a helpful assistant that can read and edit metadata entities. The metadata follows the JSON-LD format and is embedded in a Research Object Crate. Make sure to READ FIRST and WRITE SECOND, when changing metadata of entities. Always consider the request of the user as the HIGHEST PRIORITY"
    })

    return createAgentUIStreamResponse<never, typeof tools, never>({
        agent,
        uiMessages: body.messages,
        onError: (error) => {
            console.error("Error in ai chat route", error)
            return `An error occurred: ${error instanceof Error ? error.message : JSON.stringify(error)}`
        }
    })
}
