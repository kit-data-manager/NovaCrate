import {
    LanguageModelProvider,
    TextModel,
    useAIAssistantSettings
} from "@/lib/state/ai-assistant-settings"
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
import { ProviderFactory } from "@/lib/ai/providers/ProviderFactory"
import { toast } from "sonner"
import { LoaderCircle } from "lucide-react"
import { Error } from "@/components/error"

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
    const [configureError, setConfigureError] = useState<unknown>()
    const [testingNewProvider, setTestingNewProvider] = useState(false)

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

    const connectToProvider = useCallback(
        (models: TextModel[]) => {
            settings.configureProvider({
                models,
                provider: configureProvider as LanguageModelProvider,
                apiKey: configureAPIKey,
                displayName: providerDisplayName(configureProvider as LanguageModelProvider)
            })
            settings.activateProvider(configureProvider as LanguageModelProvider)
            setShowProviderConfigureModal(false)
            setConfigureProvider("")
            setConfigureAPIKey("")
        },
        [configureAPIKey, configureProvider, settings]
    )

    const testConnection = useCallback(() => {
        setTestingNewProvider(true)
        const adapter = new ProviderFactory().makeAdapter({
            models: [],
            provider: configureProvider as LanguageModelProvider,
            apiKey: configureAPIKey,
            displayName: providerDisplayName(configureProvider as LanguageModelProvider)
        })
        adapter
            .testConnection()
            .then(() => {
                adapter
                    .fetchModels()
                    .then((models) => {
                        connectToProvider(models)
                    })
                    .catch((error) => {
                        toast.error("Failed to fetch models from provider. Please try again later.")
                        console.error(error)
                        connectToProvider([])
                    })
            })
            .catch((error) => {
                console.error(error)
                setConfigureError(error)
            })
            .finally(() => {
                setTestingNewProvider(false)
            })
    }, [configureAPIKey, configureProvider, connectToProvider])

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
                        <Error title="Failed to connect to provider" error={configureError} />
                        <div className="flex justify-between">
                            <Button
                                onClick={() => setShowProviderConfigureModal(false)}
                                variant="secondary"
                            >
                                Cancel
                            </Button>
                            <Button onClick={testConnection} disabled={testingNewProvider}>
                                {testingNewProvider && (
                                    <LoaderCircle className="size-4 animate-spin" />
                                )}{" "}
                                Connect
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
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
                    <div className="flex items-center gap-1">
                        Model:{" "}
                        <Select
                            value={activeProvider.selectedModel}
                            onValueChange={handleModelSelect}
                        >
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
        </div>
    )
}
