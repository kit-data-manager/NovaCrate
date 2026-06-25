import {
    LanguageModelProvider,
    ProviderConfiguration,
    TextModel
} from "@/lib/state/ai-assistant-settings"
import { addBasePath } from "next/dist/client/add-base-path"

export function providerDisplayName(provider: LanguageModelProvider) {
    switch (provider) {
        case LanguageModelProvider.OPEN_ROUTER:
            return "OpenRouter"
        case LanguageModelProvider.OPEN_AI_COMPATIBLE:
            return "OpenAI Compatible"
        case LanguageModelProvider.OPEN_AI:
            return "OpenAI"
        case LanguageModelProvider.ANTHROPIC:
            return "Anthropic"
        default:
            return provider
    }
}

export async function testProvider(config: ProviderConfiguration) {
    const res = await fetch(addBasePath("/api/ai/test"), {
        body: JSON.stringify({ config }),
        headers: {
            "Content-Type": "application/json"
        },
        method: "POST"
    })

    if (res.ok) {
        return
    } else {
        let error
        try {
            const data: { error: string } = await res.json()
            error = data.error
        } catch (e) {
            error = res.statusText
        }
        throw new Error(error)
    }
}

export async function fetchModels(config: ProviderConfiguration) {
    const res = await fetch(addBasePath("/api/ai/models"), {
        body: JSON.stringify({ config }),
        headers: {
            "Content-Type": "application/json"
        },
        method: "POST"
    })

    if (res.ok) {
        const data: { models: TextModel[] } = await res.json()
        return data.models
    } else {
        let error
        try {
            const data: { error: string } = await res.json()
            error = data.error
        } catch (e) {
            error = res.statusText
        }
        throw new Error(error)
    }
}
