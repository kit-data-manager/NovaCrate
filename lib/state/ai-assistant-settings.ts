import { create } from "zustand"
import { persist } from "zustand/middleware"
import { unstable_ssrSafe as ssrSafe } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"

export enum LanguageModelProvider {
    OPEN_ROUTER = "openrouter"
}

interface TextModel {
    free: boolean
}

interface ProviderConfiguration {
    apiToken: string
    selectedModel?: string
    models: Map<string, TextModel>
}

export interface AIAssistantSettings {
    activeProvider?: LanguageModelProvider
    providers: Map<LanguageModelProvider, ProviderConfiguration>
    configureProvider(provider: LanguageModelProvider, config: ProviderConfiguration): void
    activateProvider(provider: LanguageModelProvider): void
    addModel(provider: LanguageModelProvider, modelName: string, modelConfig: TextModel): void
    removeModel(provider: LanguageModelProvider, modelName: string): void
    activateModel(provider: LanguageModelProvider, modelName: string): void
}

export const useAIAssistantSettings = create<AIAssistantSettings>()(
    ssrSafe(
        immer(
            persist(
                (set) => ({
                    activeProvider: undefined,
                    providers: new Map(),
                    configureProvider(
                        provider: LanguageModelProvider,
                        config: ProviderConfiguration
                    ) {
                        set((store) => {
                            store.providers.set(provider, config)
                        })
                    },
                    activateProvider(provider: LanguageModelProvider) {
                        set({ activeProvider: provider })
                    },
                    addModel(
                        provider: LanguageModelProvider,
                        modelName: string,
                        modelConfig: TextModel
                    ) {
                        set((store) => {
                            if (store.providers.has(provider)) {
                                store.providers.get(provider)!.models.set(modelName, modelConfig)
                            }
                        })
                    },
                    removeModel(provider: LanguageModelProvider, modelName: string) {
                        set((store) => {
                            if (store.providers.has(provider)) {
                                store.providers.get(provider)!.models.delete(modelName)
                            }
                        })
                    },
                    activateModel(provider: LanguageModelProvider, modelName: string) {
                        set((store) => {
                            if (store.providers.has(provider)) {
                                if (store.providers.get(provider)!.models.has(modelName)) {
                                    store.providers.get(provider)!.selectedModel = modelName
                                }
                            }
                        })
                    }
                }),
                {
                    name: "ai-assistant-settings"
                }
            )
        )
    )
)
