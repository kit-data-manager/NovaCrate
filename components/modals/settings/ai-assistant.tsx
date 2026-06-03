import { ProviderConfiguration, useAIAssistantSettings } from "@/lib/state/ai-assistant-settings"
import { Badge } from "@/components/ui/badge"
import { providerDisplayName } from "@/lib/ai/utils"
import { Button } from "@/components/ui/button"
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ConfigureProvider } from "@/components/ai/configure-provider"
import { useCallback, useState } from "react"

export function AiAssistantSettings() {
    const settings = useAIAssistantSettings()
    const [editExistingProvider, setEditExistingProvider] = useState<ProviderConfiguration | null>(
        null
    )
    const [showConfigureProviderModal, setShowConfigureProviderModal] = useState(false)
    const [mountConfigureProviderModal, setMountConfigureProviderModal] = useState(
        showConfigureProviderModal
    )

    if (showConfigureProviderModal !== mountConfigureProviderModal) {
        if (showConfigureProviderModal) {
            setMountConfigureProviderModal(showConfigureProviderModal)
        } else {
            setTimeout(() => {
                setMountConfigureProviderModal(showConfigureProviderModal)
            }, 200)
        }
    }

    const editProvider = useCallback((provider: ProviderConfiguration) => {
        setEditExistingProvider(provider)
        setShowConfigureProviderModal(true)
    }, [])

    const newProvider = useCallback(() => {
        setEditExistingProvider(null)
        setShowConfigureProviderModal(true)
    }, [])

    const deleteProvider = useCallback(
        (id: string) => {
            settings.removeProvider(id)
            if (settings.activeProvider === id) {
                settings.activateProvider(undefined)
            }
        },
        [settings]
    )

    return (
        <div className={"flex flex-col max-h-full overflow-y-auto"}>
            {mountConfigureProviderModal && (
                <ConfigureProvider
                    open={showConfigureProviderModal}
                    onOpenChange={setShowConfigureProviderModal}
                    existingConfig={editExistingProvider ?? undefined}
                />
            )}

            <h3 className="font-semibold text-2xl leading-none p-2 pl-0 pt-0 mb-2">AI Assistant</h3>

            <div className="flex justify-between items-end pb-2">
                <h4 className="text-lg font-medium">Providers</h4>
                <Button variant="outline" onClick={newProvider}>
                    <PlusIcon /> Add Provider
                </Button>
            </div>
            {settings.providers.map((provider) => (
                <div
                    key={provider.id}
                    className="p-2 border rounded-lg flex justify-between items-center gap-2 mb-2"
                >
                    <div>
                        <div>
                            <Badge variant="secondary">
                                {providerDisplayName(provider.provider)}
                            </Badge>
                            <h5 className="text-lg font-medium">{provider.displayName}</h5>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                            {provider.baseUrl && <div>URL: {provider.baseUrl}</div>}
                            <div>Models: {provider.models.length}</div>
                            {provider.headers && (
                                <div>Custom Headers: {Object.values(provider.headers).length}</div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => editProvider(provider)}>
                            <PencilIcon /> Edit
                        </Button>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="destructive">
                                    <TrashIcon />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent>
                                <div>Are you sure you want to delete this provider?</div>
                                <Button
                                    variant="destructive"
                                    className="mt-2 w-full"
                                    onClick={() => deleteProvider(provider.id)}
                                >
                                    Confirm
                                </Button>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            ))}
            {settings.providers.length === 0 && (
                <div className="text-center text-muted-foreground p-4">
                    No providers configured. Click the button above to add one.
                </div>
            )}
        </div>
    )
}
