import {
    LanguageModelProvider,
    ProviderConfiguration,
    TextModel,
    useAIAssistantSettings
} from "@/lib/state/ai-assistant-settings"
import {
    Select,
    SelectContent,
    SelectItem,
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
import { toast } from "sonner"
import { LoaderCircle, PlusIcon } from "lucide-react"
import { Error as ErrorDisplay } from "@/components/error"
import { Checkbox } from "@/components/ui/checkbox"
import { RecordInput } from "@/components/ui/record"
import { fetchModels, providerDisplayName, testProvider } from "@/lib/ai/utils"

export function ModelSelection() {
    const settings = useAIAssistantSettings()
    const activeProvider = settings.getActiveProvider()

    const [showProviderCreateModal, setShowProviderCreateModal] = useState(false)
    const [configureProvider, setConfigureProvider] = useState("")
    const [configureDisplayName, setConfigureDisplayName] = useState("")
    const [configureBaseUrl, setConfigureBaseUrl] = useState("")
    const [configureHeaders, setConfigureHeaders] = useState<[string, string][]>([])
    const [fetchModelsAutomatically, setFetchModelsAutomatically] = useState(true)
    const [configureModels, setConfigureModels] = useState<[string, string][]>([])
    const [configureAPIKey, setConfigureAPIKey] = useState("")
    const [configureError, setConfigureError] = useState<unknown>()
    const [testingNewProvider, setTestingNewProvider] = useState(false)

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

    const makeProviderConfig = useCallback(
        (models: TextModel[] = []) => {
            return {
                id: window.crypto.randomUUID(),
                models,
                provider: configureProvider as LanguageModelProvider,
                apiKey: configureAPIKey,
                displayName:
                    (configureProvider as LanguageModelProvider) ===
                    LanguageModelProvider.OPEN_AI_COMPATIBLE
                        ? configureDisplayName
                        : providerDisplayName(configureProvider as LanguageModelProvider),
                baseUrl: configureBaseUrl,
                headers: Object.fromEntries(configureHeaders)
            } satisfies ProviderConfiguration
        },
        [
            configureAPIKey,
            configureBaseUrl,
            configureDisplayName,
            configureHeaders,
            configureProvider
        ]
    )

    const connectToProvider = useCallback(
        (models: TextModel[]) => {
            settings.configureProvider(makeProviderConfig(models))
            settings.activateProvider(configureProvider as LanguageModelProvider)
            setShowProviderCreateModal(false)
            setConfigureProvider("")
            setConfigureAPIKey("")
        },
        [configureProvider, makeProviderConfig, settings]
    )

    const testConnection = useCallback(async () => {
        setTestingNewProvider(true)
        try {
            await testProvider(makeProviderConfig())
        } catch (e) {
            console.error("Error while trying to fetch models", e)
            setConfigureError(e instanceof Error ? e.message : JSON.stringify(e))
            setTestingNewProvider(false)
            return
        }

        const then = (models: TextModel[]) => {
            connectToProvider(models)
        }

        if (fetchModelsAutomatically) {
            fetchModels(makeProviderConfig())
                .then((res) => {
                    then(res)
                })
                .catch((error) => {
                    toast.error("Failed to fetch models from provider. Please try again later.")
                    console.error(error)
                    connectToProvider([])
                })
        } else {
            then(
                configureModels.map(
                    ([key, value]) => ({ id: key, displayName: value }) satisfies TextModel
                )
            )
        }
    }, [configureModels, connectToProvider, fetchModelsAutomatically, makeProviderConfig])

    return (
        <div>
            <Dialog open={showProviderCreateModal} onOpenChange={setShowProviderCreateModal}>
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
                                {Object.values(LanguageModelProvider).map((provider) => (
                                    <SelectItem value={provider} key={provider}>
                                        {providerDisplayName(provider)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {configureProvider === LanguageModelProvider.OPEN_AI_COMPATIBLE && (
                            <div>
                                <Label htmlFor="display-name">Display Name</Label>
                                <Input
                                    id="display-name"
                                    placeholder="My AI Provider"
                                    value={configureDisplayName}
                                    onChange={(e) => setConfigureDisplayName(e.target.value)}
                                />
                            </div>
                        )}
                        <div>
                            <Label htmlFor="api-key">API Key</Label>
                            <Input
                                id="api-key"
                                placeholder="Enter your API Key"
                                value={configureAPIKey}
                                onChange={(e) => setConfigureAPIKey(e.target.value)}
                            />
                        </div>

                        <div>
                            <Label htmlFor="base-url">Base URL</Label>
                            <Input
                                id="base-url"
                                placeholder="Leave empty for default"
                                value={configureBaseUrl}
                                onChange={(e) => setConfigureBaseUrl(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Headers</Label>
                            <RecordInput
                                value={configureHeaders}
                                onValueChange={setConfigureHeaders}
                                exampleValue="Bearer ..."
                                exampleKey={"Authorization"}
                                itemName={"Header"}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Models</Label>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="fetch-models-automatically"
                                    checked={fetchModelsAutomatically}
                                    onCheckedChange={(v) =>
                                        setFetchModelsAutomatically(
                                            v === "indeterminate" ? true : v
                                        )
                                    }
                                />
                                <Label htmlFor="fetch-models-automatically" className="mb-0">
                                    Fetch models automatically
                                </Label>
                            </div>
                            {!fetchModelsAutomatically && (
                                <RecordInput
                                    value={configureModels}
                                    onValueChange={setConfigureModels}
                                    exampleValue="Model Display Name"
                                    exampleKey={"model-id"}
                                    itemName={"Model"}
                                />
                            )}
                        </div>

                        <ErrorDisplay
                            title="Failed to connect to provider"
                            error={configureError}
                        />
                        <div className="flex justify-between">
                            <Button
                                onClick={() => setShowProviderCreateModal(false)}
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
                                <SelectItem value={provider.id} key={provider.id}>
                                    {provider.displayName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setShowProviderCreateModal(true)}
                    >
                        <PlusIcon className="size-4" />
                    </Button>
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
