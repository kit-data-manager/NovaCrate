import { create } from "zustand"
import { persist } from "zustand/middleware"
import { unstable_ssrSafe as ssrSafe } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"

export enum LanguageModelProvider {
    OPEN_ROUTER = "openrouter"
}

export interface TextModel {
    id: string
    displayName: string
    free: boolean
}

export interface ProviderConfiguration {
    provider: LanguageModelProvider
    displayName: string
    apiKey: string
    selectedModel?: string
    models: TextModel[]
}

export interface AIAssistantSettings {
    activeProvider?: LanguageModelProvider
    providers: ProviderConfiguration[]
    getActiveProvider(): ProviderConfiguration | undefined
    configureProvider(config: ProviderConfiguration): void
    activateProvider(provider: LanguageModelProvider): void
    addModel(provider: LanguageModelProvider, modelConfig: TextModel): void
    removeModel(provider: LanguageModelProvider, modelName: string): void
    activateModel(provider: LanguageModelProvider, modelName: string): void
}

export const useAIAssistantSettings = create<AIAssistantSettings>()(
    ssrSafe(
        immer(
            persist(
                (set, get) => ({
                    activeProvider: undefined,
                    providers: [],
                    getActiveProvider() {
                        return get().providers.find((p) => p.provider === get().activeProvider)
                    },
                    configureProvider(config: ProviderConfiguration) {
                        set((store) => {
                            const existing = store.providers.findIndex(
                                (p) => p.provider === config.provider
                            )
                            if (existing >= 0) {
                                store.providers[existing] = config
                            } else {
                                store.providers.push(config)
                            }
                        })
                    },
                    activateProvider(provider: LanguageModelProvider) {
                        set({ activeProvider: provider })
                    },
                    addModel(provider: LanguageModelProvider, modelConfig: TextModel) {
                        set((store) => {
                            const match = store.providers.find((p) => p.provider === provider)
                            if (match) {
                                const existing = match.models.findIndex(
                                    (m) => m.id === modelConfig.id
                                )
                                if (existing >= 0) {
                                    match.models[existing] = modelConfig
                                } else {
                                    match.models.push(modelConfig)
                                }
                            }
                        })
                    },
                    removeModel(provider: LanguageModelProvider, modelName: string) {
                        set((store) => {
                            store.providers.forEach((p) => {
                                if (p.provider === provider) {
                                    p.models = p.models.filter((m) => m.id !== modelName)
                                }
                            })
                        })
                    },
                    activateModel(provider: LanguageModelProvider, modelName: string) {
                        set((store) => {
                            const match = store.providers.find((p) => p.provider === provider)
                            if (match) {
                                const model = match.models.find((m) => m.id === modelName)
                                if (model) {
                                    match.selectedModel = model.id
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
