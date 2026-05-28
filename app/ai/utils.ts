import {
    LanguageModelProvider,
    ProviderConfiguration,
    useAIAssistantSettings
} from "@/lib/state/ai-assistant-settings"
import { useEffect, useMemo, useRef, useState } from "react"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { LanguageModel, ToolLoopAgent } from "ai"
import { editEntityTool, readEntityTool } from "@/app/ai/tools"

export function useAgent() {
    const settings = useAIAssistantSettings()

    const stableModelConfig = useRef<ProviderConfiguration | null>(null)
    const [stableModel, setStableModel] = useState<LanguageModel | null>(null)

    useEffect(() => {
        const active = settings.getActiveProvider()
        if (!active || !active.selectedModel) {
            setStableModel(null)
            stableModelConfig.current = null
            return
        }

        if (
            !stableModelConfig.current ||
            active.provider !== stableModelConfig.current.provider ||
            active.selectedModel !== stableModelConfig.current.selectedModel ||
            active.apiKey !== stableModelConfig.current.apiKey
        ) {
            if (active.provider === LanguageModelProvider.OPEN_ROUTER) {
                const openRouter = createOpenRouter({
                    apiKey: active.apiKey
                })

                setStableModel(openRouter(active.selectedModel))
                stableModelConfig.current = active
            }
        }
    }, [settings])

    return useMemo(() => {
        if (!stableModel) return null
        return new ToolLoopAgent({
            model: stableModel,
            tools: {
                editEntityTool,
                readEntityTool
            },
            instructions:
                "You are a helpful assistant that can read and edit metadata entities. The metadata follows the JSON-LD format and is embedded in a Research Object Crate. Make sure to READ FIRST and WRITE SECOND, when changing metadata of entities. Always consider the request of the user as the HIGHEST PRIORITY"
        })
    }, [stableModel])
}
