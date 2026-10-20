import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BugIcon, FileJson2, HardDrive, ShieldCheck, SparklesIcon } from "lucide-react"
import { PropsWithChildren, useEffect, useMemo, useState } from "react"
import { GeneralSettings } from "@/components/modals/settings/general"
import { WorkerSettings } from "@/components/modals/settings/workers"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { StoragePage } from "@/components/modals/settings/storage"
import { SchemaSettingsPage } from "@/components/modals/settings/schemas"
import { ValidationSettings } from "@/components/modals/settings/validation"
import { AiAssistantSettings } from "@/components/modals/settings/ai-assistant"
import { ProfilesSettings } from "@/components/modals/settings/profiles"

export enum SettingsPages {
    GENERAL,
    WORKERS,
    STORAGE,
    SCHEMAS,
    VALIDATION,
    AI_ASSISTANT,
    PROFILES
}

function SettingsPageButton({
    children,
    page,
    currentPage,
    setPage
}: PropsWithChildren<{
    page: SettingsPages
    currentPage: SettingsPages
    setPage(page: SettingsPages): void
}>) {
    return (
        <Button
            variant="ghost"
            className={`justify-start ${page === currentPage ? "bg-accent" : ""}`}
            onClick={() => setPage(page)}
        >
            {children}
        </Button>
    )
}

export function SettingsModal({
    open,
    onOpenChange,
    defaultPage
}: {
    open: boolean
    onOpenChange(open: boolean): void
    defaultPage?: SettingsPages
}) {
    const [page, setPage] = useState(defaultPage ?? SettingsPages.SCHEMAS)

    useEffect(() => {
        setPage(defaultPage ?? SettingsPages.SCHEMAS)
    }, [defaultPage])

    const content = useMemo(() => {
        switch (page) {
            case SettingsPages.GENERAL:
                return <GeneralSettings />
            case SettingsPages.WORKERS:
                return <WorkerSettings />
            case SettingsPages.STORAGE:
                return <StoragePage />
            case SettingsPages.SCHEMAS:
                return <SchemaSettingsPage />
            case SettingsPages.VALIDATION:
                return <ValidationSettings />
            case SettingsPages.PROFILES:
                return <ProfilesSettings />
            case SettingsPages.AI_ASSISTANT:
                return <AiAssistantSettings />
        }
    }, [page])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[1000px] h-[600px] min-w-[800px] min-h-[400px] max-w-[90vw]! max-h-[90vh] resize overflow-auto">
                <VisuallyHidden>
                    <DialogTitle>Settings</DialogTitle>
                </VisuallyHidden>

                <div className="grid grid-cols-[200px_auto] gap-4 max-h-full min-h-0">
                    <div className="flex flex-col gap-2">
                        <SettingsPageButton
                            page={SettingsPages.SCHEMAS}
                            currentPage={page}
                            setPage={setPage}
                        >
                            <FileJson2 className="size-4 mr-1" /> Schemas
                        </SettingsPageButton>
                        <SettingsPageButton
                            page={SettingsPages.VALIDATION}
                            currentPage={page}
                            setPage={setPage}
                        >
                            <BugIcon className="size-4 mr-1" /> Validation
                        </SettingsPageButton>
                        <SettingsPageButton
                            page={SettingsPages.PROFILES}
                            currentPage={page}
                            setPage={setPage}
                        >
                            <ShieldCheck className="size-4 mr-1" /> Profiles
                        </SettingsPageButton>
                        {process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED === "true" && (
                            <SettingsPageButton
                                page={SettingsPages.AI_ASSISTANT}
                                currentPage={page}
                                setPage={setPage}
                            >
                                <SparklesIcon className="size-4 mr-1" /> AI Assistant
                            </SettingsPageButton>
                        )}
                        <SettingsPageButton
                            page={SettingsPages.STORAGE}
                            currentPage={page}
                            setPage={setPage}
                        >
                            <HardDrive className="size-4 mr-1" /> Storage
                        </SettingsPageButton>
                        <SettingsPageButton
                            page={SettingsPages.WORKERS}
                            currentPage={page}
                            setPage={setPage}
                        >
                            <BugIcon className="size-4 mr-1" /> Diagnostics
                        </SettingsPageButton>
                    </div>
                    <div className="min-h-0 min-w-0 max-h-full overflow-y-auto">{content}</div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
