import { ProviderConfigurationWithoutModelsSchema } from "@/lib/state/ai-assistant-settings"
import { ProviderFactory } from "@/lib/ai/providers/ProviderFactory"

export async function POST(req: Request) {
    const body: { config: unknown } = await req.json()
    const config = ProviderConfigurationWithoutModelsSchema.parse(body.config)

    const provider = new ProviderFactory().makeAdapter(config)
    try {
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
