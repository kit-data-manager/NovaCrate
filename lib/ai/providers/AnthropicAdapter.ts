import { IProviderAdapter } from "@/lib/ai/providers/IProviderAdapter"
import { ProviderConfigurationWithoutModels, TextModel } from "@/lib/state/ai-assistant-settings"
import { createAnthropic } from "@ai-sdk/anthropic"
import { sanitizeHeaders } from "@/lib/ai/providers/sanitize-headers"
import { validateBaseUrl } from "@/lib/ai/providers/validate-base-url"

export class AnthropicAdapter implements IProviderAdapter {
    constructor(private config: ProviderConfigurationWithoutModels) {
        this.config = structuredClone(config)
        this.config.headers = sanitizeHeaders(this.config.headers)
        validateBaseUrl(this.config.baseUrl)

        if (!("anthropic-version" in this.config.headers)) {
            this.config.headers["anthropic-version"] = "2023-06-01"
        }
    }

    async testConnection() {
        await this.fetchModels()
        // If this succeeds, then the API key is valid
    }

    async fetchModels(): Promise<TextModel[]> {
        const req = await fetch(`${this.config.baseUrl || "https://api.anthropic.com/v1"}/models`, {
            headers: { "X-Api-Key": this.config.apiKey, ...this.config.headers }
        })
        if (req.ok) {
            const data = (await req.json()) as {
                data: {
                    id: string
                    created_at: string
                    display_name: string
                }[]
            }
            return data.data.map((m) => ({
                id: m.id,
                displayName: m.display_name
            }))
        } else {
            throw new Error(`Failed to fetch models (${req.status}: ${req.statusText})`, {
                cause: req
            })
        }
    }

    async getLanguageModel(modelId: string) {
        const anthropic = createAnthropic({
            apiKey: this.config.apiKey,
            headers: this.config.headers,
            baseURL: this.config.baseUrl || undefined
        })

        return anthropic(modelId)
    }
}
