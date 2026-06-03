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
import { Button } from "@/components/ui/button"
import { CheckIcon, CloudDownload, LoaderCircle } from "lucide-react"
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
    const [configureModels, setConfigureModels] = useState<[string, string][]>(
        existingConfig?.models.map((model) => [model.id, model.displayName]) ?? []
    )
    const [configureAPIKey, setConfigureAPIKey] = useState(existingConfig?.apiKey ?? "")
    const [configureError, setConfigureError] = useState<unknown>()
    const [testingNewProvider, setTestingNewProvider] = useState(false)
    const [providerTestedSuccessfully, setProviderTestedSuccessfully] = useState(false)
    const [fetchingModels, setFetchingModels] = useState(false)

    const makeProviderConfig = useCallback(
        (models: TextModel[] = []) => {
            return {
                id: existingConfig?.id ?? window.crypto.randomUUID(),
                models,
                selectedModel: models.length > 0 ? models[0].id : undefined,
                provider: configureProvider as LanguageModelProvider,
                apiKey: configureAPIKey,
                displayName:
                    configureDisplayName ||
                    providerDisplayName(configureProvider as LanguageModelProvider),
                baseUrl: configureBaseUrl,
                headers: Object.fromEntries(configureHeaders.filter((h) => h[0].trim() !== ""))
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

    const save = useCallback(() => {
        if (!configureProvider) {
            setConfigureError("Please select a provider")
            return
        }

        const sanitizedModels = configureModels.filter(
            (m) => m[0].trim() !== "" && m[1].trim() !== ""
        )
        if (sanitizedModels.length === 0) {
            setConfigureError("Please add at least one model")
            return
        }

        const config = makeProviderConfig(
            sanitizedModels.map(([id, displayName]) => ({ id, displayName }))
        )
        settings.configureProvider(config)
        settings.activateProvider(config.id)
        onOpenChange(false)
        setConfigureProvider("")
        setConfigureAPIKey("")
    }, [configureModels, configureProvider, makeProviderConfig, onOpenChange, settings])

    const _testProvider = useCallback(async () => {
        setTestingNewProvider(true)
        setProviderTestedSuccessfully(false)
        try {
            await testProvider(makeProviderConfig())
            setConfigureError(undefined)
            setProviderTestedSuccessfully(true)
        } catch (e) {
            console.error("Error while testing connection", e)
            setConfigureError(e instanceof Error ? e.message : JSON.stringify(e))
        } finally {
            setTestingNewProvider(false)
        }
    }, [makeProviderConfig])

    const _fetchModels = useCallback(async () => {
        try {
            setFetchingModels(true)
            const models = await fetchModels(makeProviderConfig())
            setConfigureModels(models.map((model) => [model.id, model.displayName]))
        } catch (error) {
            setConfigureError(
                "Failed to fetch models from provider: " +
                    (error instanceof Error ? error.message : JSON.stringify(error))
            )
        } finally {
            setFetchingModels(false)
        }
    }, [makeProviderConfig])

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
                    <div>
                        <Label htmlFor="display-name">Display Name</Label>
                        <Input
                            id="display-name"
                            placeholder="My AI Provider"
                            value={configureDisplayName}
                            onChange={(e) => setConfigureDisplayName(e.target.value)}
                        />
                    </div>
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
                        <div className="flex justify-between items-end">
                            <Label>Models</Label>
                            <Button
                                variant="outline"
                                onClick={_fetchModels}
                                disabled={fetchingModels}
                            >
                                {fetchingModels ? (
                                    <LoaderCircle className="animate-spin" />
                                ) : (
                                    <CloudDownload />
                                )}{" "}
                                Fetch Models automatically
                            </Button>
                        </div>

                        <RecordInput
                            value={configureModels}
                            onValueChange={setConfigureModels}
                            exampleValue="Model Display Name"
                            exampleKey={"model-id"}
                            itemName={"Model"}
                        />
                    </div>
                    <div className="flex gap-2 mt-8">
                        <Button
                            variant="outline"
                            onClick={_testProvider}
                            disabled={testingNewProvider}
                        >
                            {testingNewProvider && <LoaderCircle className="animate-spin" />} Test
                            connection
                        </Button>
                        {providerTestedSuccessfully && (
                            <div className="flex items-center gap-1 text-success">
                                <CheckIcon className="size-4" /> Connection successful
                            </div>
                        )}
                    </div>

                    <ErrorDisplay title="Failed to connect to provider" error={configureError} />
                    <div className="flex justify-between">
                        <Button onClick={() => onOpenChange(false)} variant="secondary">
                            Cancel
                        </Button>
                        <Button onClick={save} disabled={testingNewProvider || fetchingModels}>
                            Save
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
