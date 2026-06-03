import { IProviderAdapter } from "@/lib/ai/providers/IProviderAdapter"
import { ProviderConfigurationWithoutModels, TextModel } from "@/lib/state/ai-assistant-settings"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"

export class OpenAICompatibleAdapter implements IProviderAdapter {
    constructor(private config: ProviderConfigurationWithoutModels) {}

    async fetchModels(): Promise<TextModel[]> {
        if (!this.config.baseUrl) throw new Error("OpenAI Compatible Provider requires a base URL")

        const req = await fetch(`${this.config.baseUrl}/models`, {
            headers: { Authorization: `Bearer ${this.config.apiKey}`, ...this.config.headers }
        })
        if (req.ok) {
            const data = (await req.json()) as {
                data: {
                    id: string
                    name: string
                }[]
            }
            return data.data.map((m) => ({
                id: m.id,
                displayName: m.name,
                free: false
            }))
        } else {
            throw new Error(`Failed to fetch models (${req.status}: ${req.statusText})`, {
                cause: req
            })
        }
    }

    async getLanguageModel(modelId: string) {
        if (!this.config.baseUrl) throw new Error("OpenAI Compatible Provider requires a base URL")

        const provider = createOpenAICompatible({
            name: this.config.displayName,
            apiKey: this.config.apiKey,
            baseURL: this.config.baseUrl,
            headers: this.config.headers,
            includeUsage: true
        })
        return provider(modelId)
    }

    async testConnection(): Promise<void> {
        if (!this.config.baseUrl) throw new Error("OpenAI Compatible Provider requires a base URL")

        const url = `${this.config.baseUrl}/auths/`
        const options = {
            method: "GET",
            headers: { Authorization: `Bearer ${this.config.apiKey}`, ...this.config.headers }
        }

        try {
            const response = await fetch(url, options)
            await response.json()
            // If this succeeds, then the API key is valid
        } catch (error) {
            throw new Error(
                `Connection to AI Provider failed. ${error instanceof Error ? error.message : JSON.stringify(error)}`,
                {
                    cause: error
                }
            )
        }
    }
}
