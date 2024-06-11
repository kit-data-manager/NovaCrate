import { Dialog, DialogContent } from "@/components/ui/dialog"

export function SettingsModal({
    open,
    onOpenChange
}: {
    open: boolean
    onOpenChange(open: boolean): void
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <div>
                    <div>Left</div>
                    <div>Right</div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
