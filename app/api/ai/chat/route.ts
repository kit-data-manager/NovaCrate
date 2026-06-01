import { ProviderConfigurationSchema } from "@/lib/state/ai-assistant-settings"

export async function POST(req: Request) {
    const body = await req.json()
    const config = ProviderConfigurationSchema.parse(body)
}
