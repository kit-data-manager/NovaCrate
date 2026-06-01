import { IProviderAdapter } from "@/lib/ai/providers/IProviderAdapter"
import { ProviderConfiguration, TextModel } from "@/lib/state/ai-assistant-settings"
import { LanguageModel } from "ai"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"

export class OpenRouterAdapter implements IProviderAdapter {
    constructor(private config: ProviderConfiguration) {}

    async testConnection() {
        const url = "https://openrouter.ai/api/v1/key"
        const options = {
            method: "GET",
            headers: { Authorization: `Bearer ${this.config.apiKey}` }
        }

        try {
            const response = await fetch(url, options)
            await response.json()
            // If this succeeds, then the API key is valid
        } catch (error) {
            throw new Error(`Connection to AI Provider failed. ${JSON.stringify(error)}`, {
                cause: error
            })
        }
    }

    async fetchModels(): Promise<TextModel[]> {
        const req = await fetch("https://openrouter.ai/api/v1/models")
        if (req.ok) {
            const data = (await req.json()) as {
                data: {
                    id: string
                    name: string
                    pricing: {
                        prompt: string
                        completion: string
                        request: string
                        image: string
                        web_search: string
                        internal_reasoning: string
                        input_cache_read: string
                        input_cache_write: string
                    }
                }[]
            }
            return data.data.map((m) => ({
                id: m.id,
                displayName: m.name,
                free: Object.values(m.pricing).every((p) => p === "0")
            }))
        } else {
            throw new Error(`Failed to fetch models (${req.status}: ${req.statusText})`, {
                cause: req
            })
        }
    }

    getLanguageModel(modelId: string): LanguageModel {
        const openRouter = createOpenRouter({
            apiKey: this.config.apiKey
        })

        return openRouter(modelId)
    }
}
