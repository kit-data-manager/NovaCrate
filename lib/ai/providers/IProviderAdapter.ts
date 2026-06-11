import { TextModel } from "@/lib/state/ai-assistant-settings"
import { LanguageModel } from "ai"

export interface IProviderAdapter {
    testConnection(): Promise<void>
    fetchModels(): Promise<TextModel[]>
    getLanguageModel(modelId: string): Promise<LanguageModel>
}
