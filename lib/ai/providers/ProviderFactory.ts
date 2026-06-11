import {
    LanguageModelProvider,
    ProviderConfigurationWithoutModels
} from "@/lib/state/ai-assistant-settings"
import { OpenRouterAdapter } from "@/lib/ai/providers/OpenRouterAdapter"
import { IProviderAdapter } from "@/lib/ai/providers/IProviderAdapter"
import { OpenAICompatibleAdapter } from "@/lib/ai/providers/OpenAICompatibleAdapter"
import { OpenAIAdapter } from "@/lib/ai/providers/OpenAIAdapter"
import { AnthropicAdapter } from "@/lib/ai/providers/AnthropicAdapter"

export class ProviderFactory {
    makeAdapter(config: ProviderConfigurationWithoutModels): IProviderAdapter {
        switch (config.provider) {
            case LanguageModelProvider.OPEN_ROUTER:
                return this.makeOpenRouterAdapter(config)
            case LanguageModelProvider.OPEN_AI_COMPATIBLE:
                return this.makeOpenAICompatibleAdapter(config)
            case LanguageModelProvider.OPEN_AI:
                return this.makeOpenAIAdapter(config)
            case LanguageModelProvider.ANTHROPIC:
                return this.makeAnthropicAdapter(config)
            default:
                throw new Error(`Unsupported provider: ${config.provider}`)
        }
    }

    makeOpenRouterAdapter(config: ProviderConfigurationWithoutModels) {
        return new OpenRouterAdapter(config)
    }

    makeOpenAICompatibleAdapter(config: ProviderConfigurationWithoutModels) {
        return new OpenAICompatibleAdapter(config)
    }

    makeOpenAIAdapter(config: ProviderConfigurationWithoutModels) {
        return new OpenAIAdapter(config)
    }

    makeAnthropicAdapter(config: ProviderConfigurationWithoutModels) {
        return new AnthropicAdapter(config)
    }
}
