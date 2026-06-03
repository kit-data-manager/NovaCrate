import { create } from "zustand"
import { persist } from "zustand/middleware"
import { unstable_ssrSafe as ssrSafe } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { z } from "zod/mini"

export enum LanguageModelProvider {
    OPEN_ROUTER = "openrouter",
    OPEN_AI_COMPATIBLE = "openai-compatible"
}

export const LanguageModelProviderSchema = z.enum(Object.values(LanguageModelProvider))

export const TextModelSchema = z.object({
    id: z.string(),
    displayName: z.string()
})

export type TextModel = z.infer<typeof TextModelSchema>

export const ProviderConfigurationSchema = z.object({
    id: z.string(),
    provider: LanguageModelProviderSchema,
    displayName: z.string(),
    apiKey: z.string(),
    selectedModel: z.optional(z.string()),
    models: z.array(TextModelSchema),
    baseUrl: z.optional(z.string()),
    headers: z.optional(z.record(z.string(), z.string()))
})

export const ProviderConfigurationWithoutModelsSchema = z.omit(ProviderConfigurationSchema, {
    models: true
})

export type ProviderConfiguration = z.infer<typeof ProviderConfigurationSchema>
export type ProviderConfigurationWithoutModels = z.infer<
    typeof ProviderConfigurationWithoutModelsSchema
>

export interface AIAssistantSettings {
    activeProvider?: string
    providers: ProviderConfiguration[]
    getActiveProvider(): ProviderConfiguration | undefined
    configureProvider(config: ProviderConfiguration): void
    removeProvider(id: string): void
    activateProvider(id: string | undefined): void
    addModel(providerId: string, modelConfig: TextModel): void
    removeModel(providerId: string, modelName: string): void
    activateModel(providerId: string, modelName: string): void
}

export const useAIAssistantSettings = create<AIAssistantSettings>()(
    ssrSafe(
        immer(
            persist(
                (set, get) => ({
                    activeProvider: undefined,
                    providers: [],
                    getActiveProvider() {
                        return get().providers.find((p) => p.id === get().activeProvider)
                    },
                    configureProvider(config: ProviderConfiguration) {
                        set((store) => {
                            const existing = store.providers.findIndex((p) => p.id === config.id)
                            if (existing >= 0) {
                                store.providers[existing] = config
                            } else {
                                store.providers.push(config)
                            }
                        })
                    },
                    removeProvider(id: string) {
                        set((store) => {
                            store.providers = store.providers.filter((p) => p.id !== id)
                        })
                    },
                    activateProvider(id: string | undefined) {
                        set({ activeProvider: id })
                    },
                    addModel(providerId: string, modelConfig: TextModel) {
                        set((store) => {
                            const match = store.providers.find((p) => p.id === providerId)
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
                    removeModel(providerId: string, modelName: string) {
                        set((store) => {
                            store.providers.forEach((p) => {
                                if (p.id === providerId) {
                                    p.models = p.models.filter((m) => m.id !== modelName)
                                }
                            })
                        })
                    },
                    activateModel(providerId: string, modelName: string) {
                        set((store) => {
                            const match = store.providers.find((p) => p.id === providerId)
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
