import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BugIcon, FileJson2, HardDrive, HardHat, SparklesIcon } from "lucide-react"
import { PropsWithChildren, useEffect, useMemo, useState } from "react"
import { GeneralSettings } from "@/components/modals/settings/general"
import { WorkerSettings } from "@/components/modals/settings/workers"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { StoragePage } from "@/components/modals/settings/storage"
import { SchemaSettingsPage } from "@/components/modals/settings/schemas"
import { ValidationSettings } from "@/components/modals/settings/validation"
import { AiAssistantSettings } from "@/components/modals/settings/ai-assistant"

export enum SettingsPages {
    GENERAL,
    WORKERS,
    STORAGE,
    SCHEMAS,
    VALIDATION,
    AI_ASSISTANT
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
            className={`justify-start hover:underline underline-offset-4 ${page === currentPage ? "bg-background hover:bg-background" : ""}`}
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
            case SettingsPages.AI_ASSISTANT:
                return <AiAssistantSettings />
        }
    }, [page])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="min-w-250 min-h-150 max-h-150 flex">
                <VisuallyHidden>
                    <DialogTitle>Settings</DialogTitle>
                </VisuallyHidden>

                <div className="grid grid-cols-[200px_auto] grow">
                    <div className="absolute bg-accent top-0 left-0 w-50 h-full rounded-l p-4 flex flex-col gap-2">
                        <h3 className="font-semibold text-2xl leading-none p-2 mb-2">Settings</h3>
                        {/*<SettingsPageButton*/}
                        {/*    page={SettingsPages.GENERAL}*/}
                        {/*    currentPage={page}*/}
                        {/*    setPage={setPage}*/}
                        {/*>*/}
                        {/*    <Cog className="size-4 mr-2" /> General*/}
                        {/*</SettingsPageButton>*/}
                        <SettingsPageButton
                            page={SettingsPages.SCHEMAS}
                            currentPage={page}
                            setPage={setPage}
                        >
                            <FileJson2 className="size-4 mr-2" /> Schemas
                        </SettingsPageButton>
                        <SettingsPageButton
                            page={SettingsPages.VALIDATION}
                            currentPage={page}
                            setPage={setPage}
                        >
                            <BugIcon className="size-4 mr-2" /> Validation
                        </SettingsPageButton>
                        <SettingsPageButton
                            page={SettingsPages.AI_ASSISTANT}
                            currentPage={page}
                            setPage={setPage}
                        >
                            <SparklesIcon className="size-4 mr-2" /> AI Assistant
                        </SettingsPageButton>
                        <SettingsPageButton
                            page={SettingsPages.WORKERS}
                            currentPage={page}
                            setPage={setPage}
                        >
                            <HardHat className="size-4 mr-2" /> Workers
                        </SettingsPageButton>
                        <SettingsPageButton
                            page={SettingsPages.STORAGE}
                            currentPage={page}
                            setPage={setPage}
                        >
                            <HardDrive className="size-4 mr-2" /> Storage
                        </SettingsPageButton>
                    </div>
                    <div />
                    <div className="min-h-0 min-w-0">{content}</div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
