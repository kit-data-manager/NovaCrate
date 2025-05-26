import { Dialog, DialogContent } from "@/components/ui/dialog"
import { TypeSelect } from "@/components/modals/create-entity/type-select"

export function TypeSelectModal({
    open,
    onOpenChange,
    onTypeSelect
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    onTypeSelect: (type: string) => void
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <TypeSelect onTypeSelect={onTypeSelect} open={open} />
            </DialogContent>
        </Dialog>
    )
}
