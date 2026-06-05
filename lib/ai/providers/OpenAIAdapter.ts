import { IProviderAdapter } from "@/lib/ai/providers/IProviderAdapter"
import { ProviderConfigurationWithoutModels, TextModel } from "@/lib/state/ai-assistant-settings"
import { createOpenAI } from "@ai-sdk/openai"
import { sanitizeHeaders } from "@/lib/ai/providers/sanitize-headers"
import { validateBaseUrl } from "@/lib/ai/providers/validate-base-url"

export class OpenAIAdapter implements IProviderAdapter {
    constructor(private config: ProviderConfigurationWithoutModels) {
        this.config.headers = sanitizeHeaders(this.config.headers)
        validateBaseUrl(this.config.baseUrl)
    }

    async testConnection() {
        await this.fetchModels()
        // If this succeeds, then the API key is valid
    }

    async fetchModels(): Promise<TextModel[]> {
        const req = await fetch(`${this.config.baseUrl || "https://api.openai.com/v1"}/models`, {
            headers: { Authorization: `Bearer ${this.config.apiKey}`, ...this.config.headers }
        })
        if (req.ok) {
            const data = (await req.json()) as {
                data: {
                    id: string
                    created: number
                    owned_by: string
                }[]
            }
            return data.data.map((m) => ({
                id: m.id,
                displayName: m.id
            }))
        } else {
            throw new Error(`Failed to fetch models (${req.status}: ${req.statusText})`, {
                cause: req
            })
        }
    }

    async getLanguageModel(modelId: string) {
        const openai = createOpenAI({
            apiKey: this.config.apiKey,
            headers: this.config.headers,
            baseURL: this.config.baseUrl || undefined
        })

        return openai(modelId)
    }
}
