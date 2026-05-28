import { LanguageModelProvider, useAIAssistantSettings } from "@/lib/state/ai-assistant-settings"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { useCallback, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

function providerDisplayName(provider: LanguageModelProvider) {
    switch (provider) {
        case LanguageModelProvider.OPEN_ROUTER:
            return "OpenRouter"
        default:
            return provider
    }
}

export function ModelSelection() {
    const settings = useAIAssistantSettings()
    const activeProvider = settings.getActiveProvider()

    const [showProviderConfigureModal, setShowProviderConfigureModal] = useState(false)
    const [configureProvider, setConfigureProvider] = useState("")
    const [configureAPIKey, setConfigureAPIKey] = useState("")

    const handleProviderSelect = useCallback(
        (v: string) => {
            if (v === "configure-new") {
                setShowProviderConfigureModal(true)
            } else {
                settings.activateProvider(v as LanguageModelProvider)
            }
        },
        [settings]
    )

    const handleModelSelect = useCallback(
        (model: string) => {
            if (!activeProvider) return
            settings.activateModel(activeProvider.provider, model)
        },
        [activeProvider, settings]
    )

    const connectToProvider = useCallback(() => {
        settings.configureProvider({
            models: [],
            provider: configureProvider as LanguageModelProvider,
            apiKey: configureAPIKey,
            displayName: providerDisplayName(configureProvider as LanguageModelProvider)
        })
        settings.activateProvider(configureProvider as LanguageModelProvider)
        setShowProviderConfigureModal(false)
        setConfigureProvider("")
        setConfigureAPIKey("")
    }, [configureAPIKey, configureProvider, settings])

    return (
        <div>
            <Dialog open={showProviderConfigureModal} onOpenChange={setShowProviderConfigureModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configure AI Assistant</DialogTitle>
                        <DialogDescription>
                            You need to connect an AI provider in order to use the AI Assistant
                            within NovaCrate. NovaCrate is not affiliated with, nor does it endorse
                            the use of any of the providers listed below.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <Label htmlFor="provider">Provider</Label>
                        <Select value={configureProvider} onValueChange={setConfigureProvider}>
                            <SelectTrigger id={"provider"}>
                                <SelectValue placeholder="Select a provider" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={LanguageModelProvider.OPEN_ROUTER}>
                                    OpenRouter
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <div>
                            <Label htmlFor="api-key">API Key</Label>
                            <Input
                                id="api-key"
                                placeholder="Enter your API Key"
                                value={configureAPIKey}
                                onChange={(e) => setConfigureAPIKey(e.target.value)}
                            />
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Available models will be fetched automatically after connecting to the
                            provider. This might take a minute.
                        </div>
                        <div className="flex justify-between">
                            <Button
                                onClick={() => setShowProviderConfigureModal(false)}
                                variant="secondary"
                            >
                                Cancel
                            </Button>
                            <Button onClick={connectToProvider}>Connect</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <div>
                Provider:{" "}
                <Select value={settings.activeProvider} onValueChange={handleProviderSelect}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {settings.providers.map((provider) => (
                            <SelectItem value={provider.provider} key={provider.provider}>
                                {provider.displayName}
                            </SelectItem>
                        ))}
                        <SelectSeparator />
                        <SelectItem value={"configure-new"}>Configure...</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {activeProvider && (
                <div>
                    Model:{" "}
                    <Select value={activeProvider.selectedModel} onValueChange={handleModelSelect}>
                        <SelectTrigger>
                            <SelectValue />
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
        </div>
    )
}
