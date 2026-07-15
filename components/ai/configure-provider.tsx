import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { useCallback, useRef, useState } from "react"
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
import HelpTooltip from "@/components/help-tooltip"

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

    // Used for on open focussing
    const firstInputRef = useRef<HTMLButtonElement>(null!)

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
    }, [configureModels, configureProvider, makeProviderConfig, onOpenChange, settings])

    const _testProvider = useCallback(async () => {
        if (!configureProvider) {
            setConfigureError("Please select a provider")
            return
        }

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
    }, [configureProvider, makeProviderConfig])

    const _fetchModels = useCallback(async () => {
        if (!configureProvider) {
            setConfigureError("Please select a provider")
            return
        }

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
    }, [configureProvider, makeProviderConfig])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-h-screen overflow-y-auto"
                onOpenAutoFocus={(e) => {
                    e.preventDefault()
                    if (firstInputRef.current) {
                        firstInputRef.current.focus()
                    }
                }}
            >
                <DialogHeader>
                    <DialogTitle>Configure AI Assistant</DialogTitle>
                    <DialogDescription>
                        You need to connect an AI provider in order to use the AI Assistant within
                        NovaCrate. NovaCrate is not affiliated with, nor does it endorse the use of
                        any of the providers listed below.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <Label htmlFor="provider">
                        Provider{" "}
                        <HelpTooltip>
                            <div>Select the type of provider for the AI Assistant.</div>
                            <div>
                                <a
                                    href="https://anthropic.com"
                                    target={"_blank"}
                                    rel={"noopener noreferrer"}
                                    className="underline"
                                >
                                    Anthropic
                                </a>
                                : For use with the official Anthropic API
                            </div>
                            <div>
                                <a
                                    href="https://openai.com"
                                    target={"_blank"}
                                    rel={"noopener noreferrer"}
                                    className="underline"
                                >
                                    OpenAI
                                </a>
                                : For use with the official OpenAI API
                            </div>
                            <div>
                                <a
                                    href="https://openwebui.com/"
                                    target={"_blank"}
                                    rel={"noopener noreferrer"}
                                    className="underline"
                                >
                                    OpenAI Compatible
                                </a>
                                : For use with an OpenAI-compatible LLM provider (e.g. Open WebUI)
                            </div>
                            <div>
                                <a
                                    href="https://openrouter.com"
                                    target={"_blank"}
                                    rel={"noopener noreferrer"}
                                    className="underline"
                                >
                                    OpenRouter
                                </a>
                                : For use with OpenRouter (free models available)
                            </div>
                        </HelpTooltip>
                    </Label>
                    <Select value={configureProvider} onValueChange={setConfigureProvider}>
                        <SelectTrigger id={"provider"} ref={firstInputRef}>
                            <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.values(LanguageModelProvider)
                                .sort()
                                .map((provider) => (
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
                        <Label htmlFor="api-key">
                            API Key{" "}
                            <HelpTooltip>
                                Obtain an API Key from the selected provider. Providing an API Key
                                is required to use the AI Assistant.
                            </HelpTooltip>
                        </Label>
                        <Input
                            id="api-key"
                            placeholder="Enter your API Key"
                            value={configureAPIKey}
                            type="password"
                            onChange={(e) => setConfigureAPIKey(e.target.value)}
                        />
                    </div>

                    <div>
                        <Label htmlFor="base-url">
                            Base URL{" "}
                            {configureProvider !== "openai-compatible" && (
                                <span className="font-normal text-muted-foreground">Optional</span>
                            )}
                            {configureProvider === "openai-compatible" ? (
                                <HelpTooltip>
                                    Specify the full URL to the OpenAI Compatible provider API.
                                    Example: https://llm.example.org/api/v1
                                </HelpTooltip>
                            ) : (
                                <HelpTooltip>
                                    This field is optional. You can use it to specify a proxy to
                                    route your requests through.
                                </HelpTooltip>
                            )}
                        </Label>
                        <Input
                            id="base-url"
                            placeholder="Leave empty for default"
                            value={configureBaseUrl}
                            onChange={(e) => setConfigureBaseUrl(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>
                            Headers{" "}
                            <span className="font-normal text-muted-foreground">Optional</span>
                            <HelpTooltip>
                                Here you can specify request headers that will be included in every
                                request to the provider
                            </HelpTooltip>
                        </Label>
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
                            <Label>
                                Models{" "}
                                <HelpTooltip>
                                    This is a list of language models your provider supports. You
                                    can fill this list automatically by using the &#34;Fetch Models
                                    automatically&#34; button. You can also edit the list
                                    afterwards. Note that the list may incorrectly include non-text
                                    models, which you should remove using the delete button.
                                </HelpTooltip>
                            </Label>
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
