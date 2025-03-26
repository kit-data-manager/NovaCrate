import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Cog, HardDrive, HardHat } from "lucide-react"
import { PropsWithChildren, useMemo, useState } from "react"
import { GeneralSettings } from "@/components/modals/settings/general"
import { WorkerSettings } from "@/components/modals/settings/workers"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { StoragePage } from "@/components/modals/settings/storage"

export enum SettingsPages {
    GENERAL,
    WORKERS,
    STORAGE
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
    onOpenChange
}: {
    open: boolean
    onOpenChange(open: boolean): void
}) {
    const [page, setPage] = useState(SettingsPages.GENERAL)

    const content = useMemo(() => {
        switch (page) {
            case SettingsPages.GENERAL:
                return <GeneralSettings />
            case SettingsPages.WORKERS:
                return <WorkerSettings />
            case SettingsPages.STORAGE:
                return <StoragePage />
        }
    }, [page])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="min-w-[1000px] min-h-[600px] max-h-[600px]">
                <VisuallyHidden>
                    <DialogTitle>Settings</DialogTitle>
                </VisuallyHidden>

                <div className="grid grid-cols-[200px_auto] h-full max-h-full">
                    <div className="absolute bg-accent top-0 left-0 w-[200px] h-full rounded-l p-4 flex flex-col gap-2">
                        <h3 className="font-semibold text-2xl leading-none p-2 mb-2">Settings</h3>
                        <SettingsPageButton
                            page={SettingsPages.GENERAL}
                            currentPage={page}
                            setPage={setPage}
                        >
                            <Cog className="w-4 h-4 mr-2" /> General
                        </SettingsPageButton>
                        <SettingsPageButton
                            page={SettingsPages.WORKERS}
                            currentPage={page}
                            setPage={setPage}
                        >
                            <HardHat className="w-4 h-4 mr-2" /> Workers
                        </SettingsPageButton>
                        <SettingsPageButton
                            page={SettingsPages.STORAGE}
                            currentPage={page}
                            setPage={setPage}
                        >
                            <HardDrive className="w-4 h-4 mr-2" /> Storage
                        </SettingsPageButton>
                    </div>
                    <div />
                    <div className="max-h-full">
                        <div className="w-full h-full overflow-y-auto">{content}</div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
