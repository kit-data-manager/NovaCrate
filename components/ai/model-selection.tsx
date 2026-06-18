import { useAIAssistantSettings } from "@/lib/state/ai-assistant-settings"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { memo, useCallback, useContext } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { GlobalModalContext } from "@/components/providers/global-modals-provider"
import { SettingsPages } from "@/components/modals/settings/settings-modal"

export const ModelSelection = memo(function ModelSelection() {
    const settings = useAIAssistantSettings()
    const activeProvider = settings.getActiveProvider()
    const { showSettingsModal } = useContext(GlobalModalContext)

    const handleProviderSelect = useCallback(
        (v: string) => {
            settings.activateProvider(v)
        },
        [settings]
    )

    const handleModelSelect = useCallback(
        (model: string) => {
            if (!activeProvider) return
            settings.activateModel(activeProvider.id, model)
        },
        [activeProvider, settings]
    )

    return (
        <div>
            <div className="flex flex-wrap items-center gap-4 text-sm pt-2 px-2 opacity-80 hover:opacity-100 transition-opacity">
                <div className={`flex items-center gap-1 ${activeProvider ? "" : "text-error"}`}>
                    <Label htmlFor={"ai-provider-select"} className="mb-0">
                        Provider:{" "}
                    </Label>
                    <Select value={settings.activeProvider} onValueChange={handleProviderSelect}>
                        <SelectTrigger id={"ai-provider-select"} variant={"inline"}>
                            <SelectValue placeholder={"Select a provider..."} />
                        </SelectTrigger>
                        <SelectContent>
                            {settings.providers.map((provider) => (
                                <SelectItem value={provider.id} key={provider.id}>
                                    {provider.displayName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {activeProvider && (
                    <div
                        className={`flex items-center gap-1 ${activeProvider.selectedModel ? "" : "text-error"}`}
                    >
                        <Label className="mb-0" htmlFor={"model-select"}>
                            Model:{" "}
                        </Label>
                        <Select
                            value={activeProvider.selectedModel}
                            onValueChange={handleModelSelect}
                        >
                            <SelectTrigger id={"model-select"} variant={"inline"}>
                                <SelectValue placeholder={"Select a model..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {activeProvider.models.map((model) => (
                                    <SelectItem value={model.id} key={model.id}>
                                        {model.displayName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    className="py-0 h-4 px-0 font-normal"
                    onClick={() => showSettingsModal(SettingsPages.AI_ASSISTANT)}
                >
                    Settings
                </Button>
            </div>
        </div>
    )
})
