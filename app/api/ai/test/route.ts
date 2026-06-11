import { ProviderConfigurationWithoutModelsSchema } from "@/lib/state/ai-assistant-settings"
import { ProviderFactory } from "@/lib/ai/providers/ProviderFactory"

export async function POST(req: Request) {
    if (process.env.AI_ASSISTANT_ENABLED !== "true")
        return new Response("AI Assistant is disabled", { status: 404 })

    const body: { config: unknown } = await req.json()

    let config
    try {
        config = ProviderConfigurationWithoutModelsSchema.parse(body.config)
    } catch (e) {
        console.error("Bad request to /ai/test/", e)
        return Response.json({ error: "Bad Request" }, { status: 400 })
    }

    if (!config.apiKey) return Response.json({ error: "No API key provided" }, { status: 400 })

    try {
        const provider = new ProviderFactory().makeAdapter(config)
        await provider.testConnection()
        return Response.json({ success: true })
    } catch (error) {
        console.error(error)
        return Response.json(
            {
                success: false,
                error: error instanceof Error ? error.message : JSON.stringify(error)
            },
            { status: 500 }
        )
    }
}
