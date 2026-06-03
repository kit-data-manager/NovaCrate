import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { useCallback, useState } from "react"
import {
    LanguageModelProvider,
    ProviderConfiguration,
    TextModel,
    useAIAssistantSettings
} from "@/lib/state/ai-assistant-settings"
import { fetchModels, providerDisplayName, testProvider } from "@/lib/ai/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RecordInput } from "@/components/ui/record"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { LoaderCircle } from "lucide-react"
import { Error as ErrorDisplay } from "@/components/error"

export function ConfigureProvider({
    existingConfig,
    open,
    onOpenChange
}: {
    existingConfig?: ProviderConfiguration
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const settings = useAIAssistantSettings()

    const [configureProvider, setConfigureProvider] = useState(existingConfig?.provider ?? "")
    const [configureDisplayName, setConfigureDisplayName] = useState(
        existingConfig?.displayName ?? ""
    )
    const [configureBaseUrl, setConfigureBaseUrl] = useState(existingConfig?.baseUrl ?? "")
    const [configureHeaders, setConfigureHeaders] = useState<[string, string][]>(
        existingConfig?.headers ? Object.entries(existingConfig.headers) : []
    )
    const [fetchModelsAutomatically, setFetchModelsAutomatically] = useState(
        !(existingConfig?.models.length ?? 0 > 0)
    )
    const [configureModels, setConfigureModels] = useState<[string, string][]>(
        existingConfig?.models.map((model) => [model.id, model.displayName]) ?? []
    )
    const [configureAPIKey, setConfigureAPIKey] = useState(existingConfig?.apiKey ?? "")
    const [configureError, setConfigureError] = useState<unknown>()
    const [shouldTestProvider, setShouldTestProvider] = useState(true)
    const [testingNewProvider, setTestingNewProvider] = useState(false)

    const makeProviderConfig = useCallback(
        (models: TextModel[] = []) => {
            return {
                id: existingConfig?.id ?? window.crypto.randomUUID(),
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
            configureProvider,
            existingConfig?.id
        ]
    )

    const connectToProvider = useCallback(
        (models: TextModel[]) => {
            const config = makeProviderConfig(models)
            settings.configureProvider(config)
            settings.activateProvider(config.id)
            onOpenChange(false)
            setConfigureProvider("")
            setConfigureAPIKey("")
        },
        [makeProviderConfig, onOpenChange, settings]
    )

    const testConnection = useCallback(async () => {
        setTestingNewProvider(true)
        try {
            if (shouldTestProvider) await testProvider(makeProviderConfig())
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
                    setConfigureError(
                        "Failed to fetch models from provider: " + (error instanceof Error)
                            ? error.message
                            : JSON.stringify(error)
                    )
                    setTestingNewProvider(false)
                    return
                })
        } else {
            then(
                configureModels.map(
                    ([key, value]) => ({ id: key, displayName: value }) satisfies TextModel
                )
            )
        }
    }, [
        configureModels,
        connectToProvider,
        fetchModelsAutomatically,
        makeProviderConfig,
        shouldTestProvider
    ])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Configure AI Assistant</DialogTitle>
                    <DialogDescription>
                        You need to connect an AI provider in order to use the AI Assistant within
                        NovaCrate. NovaCrate is not affiliated with, nor does it endorse the use of
                        any of the providers listed below.
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
                                    setFetchModelsAutomatically(v === "indeterminate" ? true : v)
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
                    <div className="space-y-2 mt-8">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="test-provider"
                                checked={shouldTestProvider}
                                onCheckedChange={(v) =>
                                    setShouldTestProvider(v === "indeterminate" ? true : v)
                                }
                            />
                            <Label htmlFor="test-provider" className="mb-0">
                                Test connection
                            </Label>
                        </div>
                    </div>

                    <ErrorDisplay title="Failed to connect to provider" error={configureError} />
                    <div className="flex justify-between">
                        <Button onClick={() => onOpenChange(false)} variant="secondary">
                            Cancel
                        </Button>
                        <Button onClick={testConnection} disabled={testingNewProvider}>
                            {testingNewProvider && <LoaderCircle className="size-4 animate-spin" />}{" "}
                            Connect
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
