import { LanguageModelProvider, ProviderConfiguration } from "@/lib/state/ai-assistant-settings"
import { OpenRouterAdapter } from "@/lib/ai/providers/OpenRouterAdapter"
import { IProviderAdapter } from "@/lib/ai/providers/IProviderAdapter"
import { OpenAICompatibleAdapter } from "@/lib/ai/providers/OpenAICompatibleAdapter"

export class ProviderFactory {
    makeAdapter(config: ProviderConfiguration): IProviderAdapter {
        switch (config.provider) {
            case LanguageModelProvider.OPEN_ROUTER:
                return this.makeOpenRouterAdapter(config)
            case LanguageModelProvider.OPEN_AI_COMPATIBLE:
                return this.makeOpenAICompatibleAdapter(config)
            default:
                throw new Error(`Unsupported provider: ${config.provider}`)
        }
    }

    makeOpenRouterAdapter(config: ProviderConfiguration) {
        return new OpenRouterAdapter(config)
    }

    makeOpenAICompatibleAdapter(config: ProviderConfiguration) {
        return new OpenAICompatibleAdapter(config)
    }
}
