import { ProviderConfigurationSchema } from "@/lib/state/ai-assistant-settings"
import { ProviderFactory } from "@/lib/ai/providers/ProviderFactory"

export async function POST(req: Request) {
    const body: { config: unknown } = await req.json()
    const config = ProviderConfigurationSchema.parse(body.config)

    const provider = new ProviderFactory().makeAdapter(config)
    try {
        const models = await provider.fetchModels()
        return Response.json({ models })
    } catch (error) {
        return Response.json(
            {
                error: error instanceof Error ? error.message : JSON.stringify(error)
            },
            { status: 500 }
        )
    }
}
